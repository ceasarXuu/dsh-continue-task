/**
 * Automatic recovery runtime for Task recovery.
 *
 * Three strategies over the same durable facts:
 * - startup: a stored turn that never closed (`interrupted`) or was closed by
 *   a clean process shutdown (`aborted`/`disposed`) gets a normal continuation
 *   message after the Host starts;
 * - transient: network-class failures are retried with exponential backoff
 *   until the model request succeeds or the budget runs out;
 * - failover: quota, credential, and route failures switch the Session to a
 *   configured fallback model and continue the failed turn.
 *
 * The session log remains the source of truth. This runtime only schedules an
 * ordinary accepted prompt through `ctx.sessionController`, so every recovery
 * is visible to the user and replayable from the log.
 * @module dsh-continue-task/recovery
 */
import { randomUUID } from 'node:crypto'
import { NATIVE_CONTINUATION_CODES, liveRecoveryFor } from './classify.js'
import { createScanner } from './scan.js'
import {
  pickFallback,
  retryDelayMs,
  routeKey,
  sameRoute,
  transientDeadline,
} from './settings.js'

const ADMISSION_RETRY_LIMIT = 3

function errorText(error) {
  if (error === null || error === undefined) return 'unknown error'
  if (typeof error === 'string') return error
  return String(error.message ?? error)
}

function isArchived(ctx, sessionId) {
  const registry = ctx.get('workspaceRegistry')
  return Array.isArray(registry?.archivedSessionIds)
    && registry.archivedSessionIds.includes(sessionId)
}

/**
 * Build the recovery runtime.
 * @param ctx - Host context carrying agents, sessions, controller, query, llm, and logger.
 * @param options - durable store and default directory.
 * @returns lifecycle controls plus a status snapshot used by the settings page.
 */
export function createRecoveryRuntime(ctx, { store, logger }) {
  const timers = new Map()
  const injected = new Map()
  const admissionFailures = new Map()
  let bootTimer
  let sweepTimer
  let disposed = false

  const settings = () => store.settings
  const log = (level, message) => logger?.[level]?.(`continue-task: ${message}`)

  function recent(entry) {
    store.recent(entry)
  }

  function resetEpisode(sessionId) {
    store.resetSession(sessionId)
    injected.delete(sessionId)
    admissionFailures.delete(sessionId)
  }

  function cancelSilent(sessionId) {
    const pending = timers.get(sessionId)
    if (pending === undefined) return false
    clearTimeout(pending.timer)
    timers.delete(sessionId)
    store.note(sessionId, { nextAt: 0 })
    return true
  }

  function cancel(sessionId) {
    const cancelled = cancelSilent(sessionId)
    if (cancelled) {
      resetEpisode(sessionId)
      recent({ sessionId, kind: 'manual', action: 'cancelled', detail: '用户取消了自动续传' })
    }
    return cancelled
  }

  function stop(sessionId, decision, reason) {
    store.note(sessionId, {
      nextAt: 0,
      lastAt: Date.now(),
      kind: decision.kind,
      ...decision.code === undefined ? {} : { code: decision.code },
      lastError: reason,
    })
    recent({
      sessionId,
      kind: decision.kind,
      action: 'stopped',
      detail: reason,
    })
    log('warn', `stopped recovery for "${sessionId}": ${reason}`)
  }

  function schedule(sessionId, decision, delayMs) {
    if (disposed || timers.has(sessionId)) return false
    const delay = Math.max(0, Math.round(delayMs))
    const dueAt = Date.now() + delay
    const timer = setTimeout(() => {
      timers.delete(sessionId)
      void attempt(sessionId, decision)
    }, delay)
    timers.set(sessionId, { timer, dueAt, decision })
    store.note(sessionId, {
      nextAt: dueAt,
      lastAt: Date.now(),
      kind: decision.kind,
      ...decision.code === undefined ? {} : { code: decision.code },
    })
    return true
  }

  async function resolveAgent(sessionId) {
    const result = await ctx.sessionController.resolveAgent(sessionId)
    if (result?.agent !== undefined) return result.agent
    const failure = result?.error
    const error = new Error(failure?.message ?? `session "${sessionId}" could not be resumed`)
    error.code = failure?.code ?? 'session/not-found'
    throw error
  }

  async function chooseFallback(agent, entry) {
    const policy = settings().failover
    const used = new Set(Array.isArray(entry.switched) ? entry.switched : [])
    const current = agent.model?.current?.()
    for (let tries = 0; tries < policy.fallbacks.length; tries += 1) {
      const picked = pickFallback(current, policy.fallbacks, used)
      if (picked === undefined) return undefined
      used.add(routeKey(picked.route))
      try {
        await ctx.llm.resolveCallConfig(picked.route)
        return picked.route
      } catch (error) {
        log('warn', `fallback ${picked.route.provider}/${picked.route.model} is unavailable: ${errorText(error)}`)
      }
    }
    return undefined
  }

  function policyFor(decision) {
    const current = settings()
    if (!current.enabled) return { enabled: false, reason: '插件总开关已关闭' }
    if (decision.kind === 'startup') {
      return current.startup.enabled || decision.manual === true
        ? { enabled: true }
        : { enabled: false, reason: '启动后继续已关闭' }
    }
    if (decision.kind === 'transient') {
      if (!current.transient.enabled) return { enabled: false, reason: '网络中断自动重试已关闭' }
      return { enabled: true }
    }
    if (decision.kind === 'failover') {
      if (!current.failover.enabled) return { enabled: false, reason: '额度不足切换模型已关闭' }
      if (current.failover.fallbacks.length === 0) return { enabled: false, reason: '还没有配置备用模型' }
      return { enabled: true }
    }
    return { enabled: false, reason: '未知恢复类型' }
  }

  async function attempt(sessionId, decision) {
    if (disposed) return
    const policy = policyFor(decision)
    if (!policy.enabled) {
      recent({ sessionId, kind: decision.kind, action: 'skipped', detail: policy.reason })
      return
    }
    const current = settings()
    const entry = store.session(sessionId)
    const now = Date.now()
    let requestId
    if (decision.kind === 'transient') {
      if (entry.attempts >= current.transient.maxAttempts) {
        stop(sessionId, decision, `已达到网络重试上限（${current.transient.maxAttempts} 次）`)
        return
      }
      if (entry.firstAt !== undefined && now > transientDeadline(current.transient, entry.firstAt)) {
        stop(sessionId, decision, `网络恢复等待已超过 ${current.transient.maxWaitMinutes} 分钟`)
        return
      }
    }
    if (decision.kind === 'failover'
      && decision.selectedRoute === undefined
      && (Array.isArray(entry.switched) ? entry.switched.length : 0) >= current.failover.maxSwitches) {
      stop(sessionId, decision, `已切换 ${current.failover.maxSwitches} 次仍无法继续`)
      return
    }
    if (isArchived(ctx, sessionId)) {
      stop(sessionId, decision, '会话已归档')
      return
    }
    try {
      const agent = await resolveAgent(sessionId)
      if (agent.session.header.origin === 'subagent') {
        stop(sessionId, decision, '子会话由父会话恢复')
        return
      }
      if (agent.status === 'running') {
        recent({ sessionId, kind: decision.kind, action: 'skipped', detail: '会话已在运行，交给当前输入处理' })
        return
      }
      const inbox = agent.inbox
      const pendingInput = (inbox?.nextTurn?.length ?? 0) > 0
        || (inbox?.nextStep?.some?.(message => message.source?.kind === 'user') ?? false)
      if (pendingInput) {
        recent({ sessionId, kind: decision.kind, action: 'skipped', detail: '已有排队输入，交给用户消息处理' })
        return
      }
      let detail = decision.code ?? decision.cause ?? decision.kind
      if (decision.kind === 'failover') {
        // A retry after an admission failure (not a model failure) must keep
        // the route it already switched to instead of consuming the next one.
        let route = decision.selectedRoute
        if (route === undefined) {
          route = await chooseFallback(agent, entry)
          if (route === undefined) {
            stop(sessionId, decision, '没有可用的备用模型')
            return
          }
          await ctx.llm.resolveCallConfig(route)
          agent.model.select(route)
          entry.switched = [...(Array.isArray(entry.switched) ? entry.switched : []), routeKey(route)]
          store.note(sessionId, { switched: entry.switched })
          decision.selectedRoute = route
        } else if (!sameRoute(agent.model?.current?.(), route)) {
          agent.model.select(route)
        }
        detail = `${route.provider}/${route.model}`
      }
      const nativeRetry = decision.kind === 'transient'
        && NATIVE_CONTINUATION_CODES.has(decision.code)
      const content = decision.kind === 'startup'
        ? [{ type: 'text', text: current.startup.continuePrompt }]
        : nativeRetry
          ? []
          : [{ type: 'text', text: current.recoveryPrompt }]
      requestId = `continue-task-${randomUUID()}`
      injected.set(sessionId, { requestId, at: now })
      const signal = AbortSignal.timeout(30_000)
      await ctx.sessionController.prompt({ requestId, sessionId, mode: 'queue', content }, signal)
      admissionFailures.delete(sessionId)
      store.note(sessionId, {
        attempts: entry.attempts + 1,
        lastAt: now,
        nextAt: 0,
        ...entry.firstAt === undefined ? { firstAt: now } : {},
        kind: decision.kind,
        ...decision.code === undefined ? {} : { code: decision.code },
        lastError: '',
      })
      recent({
        sessionId,
        kind: decision.kind,
        action: 'continued',
        detail: decision.kind === 'failover' ? `已切换到 ${detail} 并继续` : `已请求继续（${detail}）`,
      })
      log('info', `continued "${sessionId}" (${decision.kind}${decision.code === undefined ? '' : `/${decision.code}`})`)
    } catch (error) {
      if (requestId !== undefined && injected.get(sessionId)?.requestId === requestId) {
        injected.delete(sessionId)
      }
      const message = errorText(error)
      const code = typeof error?.code === 'string' ? error.code : ''
      store.note(sessionId, {
        lastAt: now,
        nextAt: 0,
        kind: decision.kind,
        ...decision.code === undefined ? {} : { code: decision.code },
        lastError: message,
      })
      const failures = (admissionFailures.get(sessionId) ?? 0) + 1
      admissionFailures.set(sessionId, failures)
      const reason = typeof error?.details?.reason === 'string' ? error.details.reason : ''
      const noContinuable = reason === 'NO_CONTINUABLE_FAILURE_OR_PENDING_INPUT'
        || message.includes('NO_CONTINUABLE_FAILURE_OR_PENDING_INPUT')
      if (noContinuable) {
        stop(sessionId, decision, message)
        return
      }
      const retryLimit = decision.kind === 'startup' ? ADMISSION_RETRY_LIMIT * 2 : ADMISSION_RETRY_LIMIT
      const canRetry = failures < retryLimit && code !== 'session/not-found'
      if (canRetry) {
        schedule(sessionId, decision, decision.kind === 'failover' ? 2_000 : 5_000)
        recent({ sessionId, kind: decision.kind, action: 'retrying', detail: message })
      } else {
        stop(sessionId, decision, message)
      }
    }
  }

  function scheduleLive(sessionId, decision) {
    if (disposed || timers.has(sessionId)) return
    if (isArchived(ctx, sessionId)) return
    const policy = policyFor(decision)
    if (!policy.enabled) {
      recent({ sessionId, kind: decision.kind, action: 'skipped', detail: policy.reason })
      return
    }
    if (decision.kind === 'transient') {
      const entry = store.session(sessionId)
      const policy = settings().transient
      if (entry.attempts >= policy.maxAttempts) {
        stop(sessionId, decision, `已达到网络重试上限（${policy.maxAttempts} 次）`)
        return
      }
      const attemptNumber = entry.attempts + 1
      const delay = retryDelayMs(attemptNumber, policy, decision.retryAfterMs)
      schedule(sessionId, decision, delay)
      recent({
        sessionId,
        kind: decision.kind,
        action: 'scheduled',
        detail: `${decision.code ?? '网络错误'}，约 ${Math.ceil(delay / 1000)} 秒后重试`,
      })
      return
    }
    schedule(sessionId, decision, 1_500)
    recent({
      sessionId,
      kind: decision.kind,
      action: 'scheduled',
      detail: `${decision.code ?? '模型不可用'}，准备切换备用模型`,
    })
  }

  const scanner = createScanner({
    ctx,
    store,
    logger,
    policyFor,
    schedule,
    recent,
    cancelPending: cancelSilent,
    resetEpisode,
    isDisposed: () => disposed,
  })

  function onEvent(session, event) {
    if (disposed) return
    const sessionId = session.id
    if (event.type === 'user/message') {
      const source = event.data?.source
      const owned = injected.get(sessionId)
      if (owned !== undefined && source?.rpcId === owned.requestId) {
        injected.delete(sessionId)
        return
      }
      if (source?.kind === 'user' || source?.kind === 'retry') {
        cancelSilent(sessionId)
        resetEpisode(sessionId)
      }
      return
    }
    if (event.type === 'turn/start') {
      cancelSilent(sessionId)
      return
    }
    if (event.type !== 'turn/end') return
    const reason = event.data?.reason
    if (reason?.kind === 'error') {
      const decision = liveRecoveryFor(reason)
      if (decision === null) return
      if (session.header?.origin === 'subagent') return
      if (!settings().enabled) return
      cancelSilent(sessionId)
      scheduleLive(sessionId, decision)
      return
    }
    if (reason?.kind === 'completed' || reason?.kind === 'aborted') {
      cancelSilent(sessionId)
      resetEpisode(sessionId)
    }
  }

  function status() {
    const current = settings()
    return {
      enabled: current.enabled,
      settings: current,
      ...scanner.status(),
      lastScanAt: store.state.lastScanAt,
      pending: [...timers.entries()]
        .map(([sessionId, pending]) => ({
          sessionId,
          dueAt: pending.dueAt,
          kind: pending.decision.kind,
          code: pending.decision.code ?? null,
          title: typeof pending.decision.title === 'string' ? pending.decision.title : '',
          attempts: store.session(sessionId).attempts ?? 0,
        }))
        .sort((left, right) => left.dueAt - right.dueAt),
      recent: store.state.recent.slice(0, 20),
    }
  }

  let offSession

  async function start() {
    offSession = ctx.on('session/event', onEvent)
    const grace = Math.max(0, settings().startup.graceSeconds * 1_000)
    bootTimer = setTimeout(() => { void scanner.boot() }, grace + 150)
    sweepTimer = setInterval(() => {
      const now = Date.now()
      for (const [sessionId, value] of injected) {
        if (now - value.at > 10 * 60_000) injected.delete(sessionId)
      }
      store.prune(now)
    }, 60_000)
    return status()
  }

  async function shutdown() {
    disposed = true
    if (bootTimer !== undefined) clearTimeout(bootTimer)
    if (sweepTimer !== undefined) clearInterval(sweepTimer)
    if (typeof offSession === 'function') offSession()
    offSession = undefined
    scanner.stop()
    for (const [sessionId, pending] of timers) {
      clearTimeout(pending.timer)
      store.note(sessionId, { nextAt: 0 })
    }
    timers.clear()
    admissionFailures.clear()
    injected.clear()
  }

  return {
    start,
    stop: shutdown,
    scan: options => scanner.scan(options),
    cancel,
    status,
    cancelPending(sessionId) { return cancelSilent(sessionId) },
  }
}
