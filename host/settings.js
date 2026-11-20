/**
 * Settings shape, defaults, validation, and retry math for Task recovery.
 * This module is pure: no Cordis, DSH, or filesystem imports, so the same
 * rules can be unit-tested and reused by the Host API.
 * @module dsh-continue-task/settings
 */

/** Default user-facing continuation text used after an app restart. */
export const DEFAULT_CONTINUE_PROMPT = '应用在上一轮执行过程中退出或被重启了，当前任务尚未完成。请从中断处继续完成任务；如果有工具调用的结果未知，请先核实外部状态再决定是否重试。'

/** Default text for recovery paths DSH does not expose as a native retry. */
export const DEFAULT_RECOVERY_PROMPT = '上一轮模型请求因服务或额度问题没能完成。请从中断处继续完成当前任务；如果有工具调用的结果未知，请先核实外部状态再决定是否重试。'

/** Bounded number of model routes the failover strategy may try. */
export const MAX_FALLBACKS = 3

/** Default settings; every stored value is resolved over this object. */
export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  recoveryPrompt: DEFAULT_RECOVERY_PROMPT,
  startup: {
    enabled: true,
    graceSeconds: 3,
    lookbackMinutes: 30,
    maxSessions: 2,
    continuePrompt: DEFAULT_CONTINUE_PROMPT,
  },
  transient: {
    enabled: true,
    maxAttempts: 10,
    baseDelaySeconds: 15,
    maxDelaySeconds: 300,
    maxWaitMinutes: 30,
  },
  failover: {
    enabled: true,
    maxSwitches: 2,
    fallbacks: [],
  },
})

/** A setting value the user supplied cannot be accepted. */
export class SettingsError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SettingsError'
  }
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : undefined
}

function integer(value, fallback, min, max, label) {
  if (value === undefined) return fallback
  const number = typeof value === 'string' ? Number(value) : value
  if (typeof number !== 'number' || !Number.isFinite(number) || !Number.isInteger(number)) {
    throw new SettingsError(`${label}必须是整数。`)
  }
  if (number < min || number > max) throw new SettingsError(`${label}必须在 ${min} 到 ${max} 之间。`)
  return number
}

function boolean(value, fallback, label) {
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') throw new SettingsError(`${label}必须是开或关。`)
  return value
}

function text(value, fallback, maxLength, label) {
  if (value === undefined) return fallback
  if (typeof value !== 'string') throw new SettingsError(`${label}必须是文本。`)
  const trimmed = value.trim()
  if (trimmed.length === 0) throw new SettingsError(`${label}不能为空。`)
  if (trimmed.length > maxLength) throw new SettingsError(`${label}不能超过 ${maxLength} 个字符。`)
  return trimmed
}

function requiredText(value, maxLength, label) {
  if (typeof value !== 'string') throw new SettingsError(`${label}不能为空。`)
  const trimmed = value.trim()
  if (trimmed.length === 0) throw new SettingsError(`${label}不能为空。`)
  if (trimmed.length > maxLength) throw new SettingsError(`${label}不能超过 ${maxLength} 个字符。`)
  return trimmed
}

function optionalText(value, maxLength, label) {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') throw new SettingsError(`${label}必须是文本。`)
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  if (trimmed.length > maxLength) throw new SettingsError(`${label}不能超过 ${maxLength} 个字符。`)
  return trimmed
}

/**
 * Normalize one fallback route.
 * @param value - candidate route object.
 * @param index - zero-based position, used in messages.
 * @returns a route with trimmed provider, model, and optional effort.
 */
export function normalizeFallback(value, index) {
  const candidate = record(value)
  if (candidate === undefined) throw new SettingsError(`备用模型 ${index + 1} 的格式无效。`)
  return {
    provider: requiredText(candidate.provider, 200, `备用模型 ${index + 1} 的服务商`),
    model: requiredText(candidate.model, 300, `备用模型 ${index + 1} 的模型`),
    ...candidate.reasoningEffort === undefined
      ? {}
      : { reasoningEffort: optionalText(candidate.reasoningEffort, 100, `备用模型 ${index + 1} 的推理强度`) },
  }
}

/**
 * Normalize a settings candidate over the current defaults.
 * Unknown keys are dropped; invalid values reject with a user-facing message.
 * @param input - candidate settings, usually a JSON body.
 * @param base - resolved settings to inherit omitted fields from.
 * @returns a complete, bounded settings object.
 */
export function normalizeSettings(input, base = DEFAULT_SETTINGS) {
  const candidate = record(input) ?? {}
  const startup = record(candidate.startup) ?? {}
  const transient = record(candidate.transient) ?? {}
  const failover = record(candidate.failover) ?? {}
  const fallbacks = failover.fallbacks === undefined
    ? base.failover.fallbacks
    : failover.fallbacks
  if (!Array.isArray(fallbacks)) throw new SettingsError('备用模型列表的格式无效。')
  if (fallbacks.length > MAX_FALLBACKS) throw new SettingsError(`备用模型最多 ${MAX_FALLBACKS} 个。`)
  const seen = new Set()
  const routes = []
  for (const [index, entry] of fallbacks.entries()) {
    const route = normalizeFallback(entry, index)
    const key = `${route.provider}\u0000${route.model}\u0000${route.reasoningEffort ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    routes.push(route)
  }
  return {
    enabled: boolean(candidate.enabled, base.enabled, '总开关'),
    recoveryPrompt: text(candidate.recoveryPrompt, base.recoveryPrompt, 2000, '恢复提示语'),
    startup: {
      enabled: boolean(startup.enabled, base.startup.enabled, '启动后继续'),
      graceSeconds: integer(startup.graceSeconds, base.startup.graceSeconds, 0, 120, '启动等待秒数'),
      lookbackMinutes: integer(startup.lookbackMinutes, base.startup.lookbackMinutes, 1, 10080, '启动扫描回看分钟数'),
      maxSessions: integer(startup.maxSessions, base.startup.maxSessions, 1, 10, '每次启动最多恢复的会话数'),
      continuePrompt: text(startup.continuePrompt, base.startup.continuePrompt, 2000, '续传提示语'),
    },
    transient: {
      enabled: boolean(transient.enabled, base.transient.enabled, '网络中断自动重试'),
      maxAttempts: integer(transient.maxAttempts, base.transient.maxAttempts, 1, 20, '网络重试次数'),
      baseDelaySeconds: integer(transient.baseDelaySeconds, base.transient.baseDelaySeconds, 5, 3600, '首次重试等待秒数'),
      maxDelaySeconds: integer(transient.maxDelaySeconds, base.transient.maxDelaySeconds, 5, 86400, '单次最长等待秒数'),
      maxWaitMinutes: integer(transient.maxWaitMinutes, base.transient.maxWaitMinutes, 1, 1440, '网络恢复总等待分钟数'),
    },
    failover: {
      enabled: boolean(failover.enabled, base.failover.enabled, '额度不足切换模型'),
      maxSwitches: integer(failover.maxSwitches, base.failover.maxSwitches, 0, MAX_FALLBACKS, '切换次数'),
      fallbacks: routes,
    },
  }
}

/** A route is identified by provider, model, and explicit reasoning effort. */
export function routeKey(selection) {
  return `${selection.provider}\u0000${selection.model}\u0000${selection.reasoningEffort ?? ''}`
}

/** Compare only the provider/model pair, ignoring an effort difference. */
export function sameRoute(left, right) {
  return left !== undefined && right !== undefined
    && left.provider === right.provider && left.model === right.model
}

/**
 * Choose the next fallback route.
 * @param current - route currently recorded by the Agent, when known.
 * @param fallbacks - validated fallback routes in preference order.
 * @param used - route keys already tried for this failure episode.
 * @returns the first usable route and its index, or undefined.
 */
export function pickFallback(current, fallbacks, used = new Set()) {
  for (const [index, entry] of fallbacks.entries()) {
    if (used.has(routeKey(entry))) continue
    if (sameRoute(current, entry)) continue
    return { route: entry, index }
  }
  return undefined
}

/**
 * Exponential backoff for one transient retry attempt.
 * @param attempt - one-based attempt number.
 * @param transient - normalized transient policy.
 * @param retryAfterMs - provider-requested delay, when available.
 * @param random - jitter source in [0, 1); injectable for tests.
 * @returns delay in milliseconds, capped by the policy and total wait budget.
 */
export function retryDelayMs(attempt, transient, retryAfterMs, random = Math.random) {
  const exponent = Math.max(0, attempt - 1)
  const base = transient.baseDelaySeconds * 1000
  const cap = Math.min(transient.maxDelaySeconds * 1000, transient.maxWaitMinutes * 60_000)
  const requested = typeof retryAfterMs === 'number' && Number.isFinite(retryAfterMs) && retryAfterMs > 0
    ? retryAfterMs
    : 0
  const raw = Math.max(Math.min(base * 2 ** exponent, cap), Math.min(requested, cap))
  const jitter = 0.85 + Math.max(0, Math.min(0.999999, random())) * 0.3
  return Math.max(1000, Math.round(raw * jitter))
}

/** Total time budget after which transient retries stop. */
export function transientDeadline(transient, startedAt) {
  return startedAt + transient.maxWaitMinutes * 60_000
}
