/**
 * Durable plugin state: user settings, per-session attempt budgets, and a
 * bounded recent-action log. Stored as one JSON file inside the profile so it
 * survives restarts without becoming session history.
 * @module dsh-continue-task/store
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { renameSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeSettings } from './settings.js'

const MAX_RECENT = 80
const MAX_SESSIONS = 200
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Resolve the profile-owned state directory.
 * @param ctx - Host context, with optional profileContext.
 * @param configured - explicit directory from plugin config.
 * @returns an absolute directory path.
 */
export function resolveStateDir(ctx, configured) {
  if (typeof configured === 'string' && configured.trim() !== '') return configured.trim()
  const profileDir = ctx.get('profileContext')?.dir
    ?? process.env.DSH_PROFILE_DIR
    ?? join(process.env.HOME ?? '.', '.dsh', 'profiles', process.env.DSH_PROFILE ?? 'desktop')
  return join(profileDir, 'continue-task')
}

function cleanSessions(raw) {
  const output = Object.create(null)
  if (raw === null || typeof raw !== 'object') return output
  const cutoff = Date.now() - SESSION_TTL_MS
  for (const [id, value] of Object.entries(raw)) {
    if (typeof id !== 'string' || value === null || typeof value !== 'object') continue
    const lastAt = Number(value.lastAt)
    if (!Number.isSafeInteger(lastAt) || lastAt < cutoff) continue
    output[id] = {
      attempts: Number.isSafeInteger(value.attempts) && value.attempts >= 0 ? value.attempts : 0,
      lastAt,
      ...Number.isSafeInteger(value.firstAt) ? { firstAt: value.firstAt } : {},
      ...Number.isSafeInteger(value.nextAt) ? { nextAt: value.nextAt } : {},
      ...typeof value.kind === 'string' ? { kind: value.kind.slice(0, 40) } : {},
      ...typeof value.code === 'string' ? { code: value.code.slice(0, 80) } : {},
      ...typeof value.lastError === 'string' ? { lastError: value.lastError.slice(0, 500) } : {},
      ...Array.isArray(value.switched)
        ? { switched: value.switched.filter(entry => typeof entry === 'string').slice(0, 3) }
        : {},
    }
  }
  const entries = Object.entries(output)
  if (entries.length <= MAX_SESSIONS) return output
  entries.sort((left, right) => right[1].lastAt - left[1].lastAt)
  return Object.fromEntries(entries.slice(0, MAX_SESSIONS))
}

function cleanRecent(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(entry => entry !== null && typeof entry === 'object')
    .slice(0, MAX_RECENT)
    .map(entry => ({
      at: Number.isSafeInteger(entry.at) ? entry.at : 0,
      sessionId: typeof entry.sessionId === 'string' ? entry.sessionId : '',
      kind: typeof entry.kind === 'string' ? entry.kind.slice(0, 40) : 'event',
      action: typeof entry.action === 'string' ? entry.action.slice(0, 80) : '',
      detail: typeof entry.detail === 'string' ? entry.detail.slice(0, 500) : '',
    }))
}

/**
 * Open the plugin state file.
 * @param options - state directory, logger, and optional initial settings.
 * @returns a store with synchronous reads and debounced durable writes.
 */
export async function createStore({ dir, logger, initialSettings }) {
  await mkdir(dir, { recursive: true, mode: 0o700 })
  const file = join(dir, 'state.json')
  let raw = {}
  try {
    raw = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      logger?.warn(`continue-task: state file is unreadable (${error?.message ?? error}); starting with defaults`)
      try {
        renameSync(file, `${file}.corrupt-${Date.now()}`)
      } catch {
        // Keep the unreadable original in place when it cannot be moved.
      }
    }
  }
  let settings
  try {
    settings = normalizeSettings(raw?.settings ?? initialSettings ?? {})
  } catch (error) {
    logger?.warn(`continue-task: saved settings were invalid (${error?.message ?? error}); using defaults`)
    settings = normalizeSettings(initialSettings ?? {})
  }
  const state = {
    version: 1,
    settings,
    sessions: cleanSessions(raw?.sessions),
    recent: cleanRecent(raw?.recent),
    lastScanAt: Number.isSafeInteger(raw?.lastScanAt) ? raw.lastScanAt : 0,
  }
  let timer
  let chain = Promise.resolve()
  let closed = false

  const write = async () => {
    const body = JSON.stringify(state, null, 2)
    const temporary = `${file}.tmp`
    await writeFile(temporary, body, { mode: 0o600 })
    await rename(temporary, file)
  }

  const saveSoon = () => {
    if (closed) return
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      chain = chain.then(write).catch(error => {
        logger?.warn(`continue-task: could not save plugin state: ${error?.message ?? error}`)
      })
    }, 120)
  }

  const flush = async () => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
      chain = chain.then(write)
    }
    await chain.catch(error => {
      logger?.warn(`continue-task: could not save plugin state: ${error?.message ?? error}`)
    })
  }

  return {
    dir,
    file,
    state,
    get settings() { return state.settings },
    setSettings(input) {
      state.settings = normalizeSettings(input, state.settings)
      saveSoon()
      return state.settings
    },
    session(id) {
      let entry = state.sessions[id]
      if (entry === undefined) {
        entry = { attempts: 0, lastAt: 0 }
        state.sessions[id] = entry
      }
      return entry
    },
    note(id, patch) {
      const entry = this.session(id)
      Object.assign(entry, patch)
      saveSoon()
      return entry
    },
    resetSession(id) {
      delete state.sessions[id]
      saveSoon()
    },
    recent(entry) {
      state.recent.unshift({
        at: Date.now(),
        sessionId: String(entry.sessionId ?? ''),
        kind: String(entry.kind ?? 'event'),
        action: String(entry.action ?? ''),
        detail: String(entry.detail ?? ''),
      })
      if (state.recent.length > MAX_RECENT) state.recent.length = MAX_RECENT
      saveSoon()
    },
    setLastScan(at) {
      state.lastScanAt = at
      saveSoon()
    },
    prune(now = Date.now()) {
      for (const [id, entry] of Object.entries(state.sessions)) {
        if (now - entry.lastAt > SESSION_TTL_MS) delete state.sessions[id]
      }
    },
    saveSoon,
    flush,
    async close() {
      closed = true
      await flush()
    },
  }
}

