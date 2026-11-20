/**
 * Startup scan for Task recovery: inspect recently used stored sessions and
 * schedule recovery for ones whose final turn did not finish.
 * @module dsh-continue-task/scan
 */
import { statSync } from 'node:fs'
import { bootRecoveryFor } from './classify.js'

const RECENT_RECOVERY_GUARD_MS = 60_000

function errorText(error) {
  return String(error?.message ?? error)
}

/**
 * Create the startup/manual scanner.
 * @param options - context, store, policy lookup, scheduler, recent sink, and disposed probe.
 * @returns scan, boot, status, and stop controls.
 */
export function createScanner({ ctx, store, logger, policyFor, schedule, recent, cancelPending, resetEpisode, isDisposed }) {
  let scanning = false
  let scanAbort
  let lastScan = null

  function mtimeOf(path) {
    if (typeof path !== 'string' || path === '') return 0
    try {
      return statSync(path).mtimeMs
    } catch {
      return 0
    }
  }

  async function storedLocations() {
    const locations = new Map()
    try {
      const persistence = ctx.get('sessionPersistence')
      if (persistence === undefined || typeof persistence.list !== 'function') return locations
      const snapshots = await persistence.list()
      for (const snapshot of snapshots) {
        const path = snapshot?.location?.path
        if (typeof path === 'string') locations.set(snapshot.header?.id, path)
      }
    } catch (error) {
      logger?.warn(`continue-task: could not read stored session locations: ${errorText(error)}`)
    }
    return locations
  }

  async function scan({ manual = false } = {}) {
    const current = store.settings
    if (isDisposed()) return { skipped: 'disposed' }
    if (!current.enabled) return { skipped: 'disabled' }
    if (!manual && !current.startup.enabled) return { skipped: 'startup-disabled' }
    if (scanning) return { skipped: 'busy' }
    scanning = true
    const startedAt = Date.now()
    let inspected = 0
    let scheduled = 0
    scanAbort = new AbortController()
    try {
      const rows = (await ctx.sessionController.list({}, scanAbort.signal)).items
      const locations = await storedLocations()
      const archived = new Set(ctx.get('workspaceRegistry')?.archivedSessionIds ?? [])
      const cutoff = startedAt - current.startup.lookbackMinutes * 60_000
      const candidates = rows
        .filter(row => row.blank !== true
          && row.running !== true
          && row.origin !== 'subagent'
          && !archived.has(row.sessionId))
        .map(row => ({
          row,
          recentAt: Math.max(Number(row.updatedAt) || 0, mtimeOf(locations.get(row.sessionId))),
        }))
        .filter(entry => entry.recentAt >= cutoff)
        .sort((left, right) => right.recentAt - left.recentAt)
        .slice(0, Math.max(10, current.startup.maxSessions * 4))
      for (const { row } of candidates) {
        if (isDisposed() || scheduled >= current.startup.maxSessions) break
        const previous = store.state.sessions[row.sessionId]
        if (previous !== undefined && previous.lastAt > 0 && startedAt - previous.lastAt < RECENT_RECOVERY_GUARD_MS) continue
        let snapshot
        try {
          snapshot = await ctx.sessionQuery.readSession(row.sessionId)
        } catch (error) {
          logger?.warn(`continue-task: could not read session "${row.sessionId}": ${errorText(error)}`)
          continue
        }
        inspected += 1
        const detected = bootRecoveryFor(snapshot.events)
        if (detected === null) continue
        const decision = manual ? { ...detected, manual: true } : detected
        if (!policyFor(decision).enabled) continue
        if (manual) {
          cancelPending(row.sessionId)
          resetEpisode(row.sessionId)
        }
        const delay = decision.kind === 'startup' ? 0 : decision.kind === 'failover' ? 500 : 1_000
        if (!schedule(row.sessionId, decision, delay)) continue
        scheduled += 1
        recent({
          sessionId: row.sessionId,
          kind: decision.kind,
          action: 'scheduled',
          detail: decision.cause === 'crash'
            ? '检测到应用意外退出，准备继续'
            : decision.cause === 'app-exit'
              ? '检测到应用退出时任务未完成，准备继续'
              : `${decision.code ?? decision.kind}，准备恢复`,
        })
      }
      lastScan = {
        at: startedAt,
        manual,
        rows: rows.length,
        inspected,
        scheduled,
        durationMs: Date.now() - startedAt,
      }
      store.setLastScan(startedAt)
      if (scheduled > 0 || manual) {
        recent({
          sessionId: '',
          kind: 'scan',
          action: 'scan',
          detail: `扫描 ${rows.length} 个会话，检查 ${inspected} 个，安排恢复 ${scheduled} 个`,
        })
      }
      logger?.info(`continue-task: scan finished: ${scheduled} recovery action(s) from ${inspected} inspected session(s)`)
      return lastScan
    } catch (error) {
      if (isDisposed()) return { skipped: 'disposed' }
      logger?.warn(`continue-task: scan failed: ${errorText(error)}`)
      return { error: errorText(error), inspected, scheduled }
    } finally {
      scanning = false
      scanAbort = undefined
    }
  }

  async function boot() {
    if (isDisposed() || !store.settings.enabled || !store.settings.startup.enabled) return
    for (let attempt = 0; attempt < 15 && !isDisposed(); attempt += 1) {
      const result = await scan()
      if (result.error === undefined) return
      await new Promise(resolve => setTimeout(resolve, 2_000))
    }
  }

  function status() {
    return { scanning, lastScan }
  }

  function stop() {
    scanAbort?.abort()
  }

  return { scan, boot, status, stop }
}
