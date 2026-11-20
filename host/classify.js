/**
 * Failure classification and durable-tail analysis for Task recovery.
 * Pure functions over DSH's public session event shapes; no imports.
 * @module dsh-continue-task/classify
 */

/** Failure codes that are worth retrying after a delay. */
export const TRANSIENT_CODES = new Set([
  'TRANSPORT',
  'TIMEOUT',
  'SERVER',
  'STREAM_CLOSED',
  'EMPTY_RESPONSE',
  'MALFORMED_RESPONSE',
  'RATE_LIMIT',
  'PI_AI_ERROR',
])

/** Terminal codes DSH itself accepts for an empty manual-continuation prompt. */
export const NATIVE_CONTINUATION_CODES = new Set([
  'RATE_LIMIT',
  'SERVER',
  'TIMEOUT',
  'TRANSPORT',
  'EMPTY_RESPONSE',
  'STREAM_CLOSED',
])

/** Failure codes that mean the current route cannot serve the next request. */
export const FAILOVER_CODES = new Set([
  'QUOTA',
  'ACCOUNT_QUOTA',
  'AUTH',
  'MISSING_CREDENTIAL',
  'INVALID_CREDENTIAL',
  'ACCOUNT_SIGN_IN_REQUIRED',
  'ACCOUNT_TOKEN_INVALID',
  'NO_ADAPTER',
  'UNKNOWN_MODEL',
  'MODEL_UNSUPPORTED',
  'INVALID_MODEL_CONTEXT',
  'INVALID_MODEL_MAX_TOKENS',
  'INVALID_MODEL_REASONING',
  'UNSUPPORTED_REASONING_EFFORT',
])

/**
 * Classify one provider-neutral LLM failure code.
 * @param code - failure code recorded on `turn/end` or `agent/request-error`.
 * @returns `transient`, `failover`, or null when automatic recovery does not apply.
 */
export function classifyFailure(code) {
  if (typeof code !== 'string') return null
  const normalized = code.trim().toUpperCase()
  if (TRANSIENT_CODES.has(normalized)) return 'transient'
  if (FAILOVER_CODES.has(normalized)) return 'failover'
  const http = /^HTTP_(\d{3})$/.exec(normalized)
  if (http !== null) {
    const status = Number(http[1])
    if (status === 408 || status === 425 || status === 429 || status >= 500) return 'transient'
    if (status === 401 || status === 402 || status === 403 || status === 404) return 'failover'
  }
  return null
}

/** Codes that count as quota exhaustion in the status surface. */
export function isQuotaCode(code) {
  return code === 'QUOTA' || code === 'ACCOUNT_QUOTA' || code === 'ACCOUNT_SIGN_IN_REQUIRED'
}

function isHumanMessage(event) {
  return event?.type === 'user/message'
    && event.data?.surfaceOp === 'append'
    && (event.data.source?.kind === 'user' || event.data.source?.kind === 'retry')
}

/**
 * Summarize the final turn of one durable event log.
 * @param events - chronological session events, already balanced if the log was interrupted.
 * @returns the final turn's reason and whether it admitted human work and entered a step.
 */
export function lastTurnReport(events) {
  if (!Array.isArray(events) || events.length === 0) return null
  let endIndex = -1
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index]?.type === 'turn/end') {
      endIndex = index
      break
    }
  }
  if (endIndex < 0) return null
  let startIndex = -1
  for (let index = endIndex; index >= 0; index -= 1) {
    if (events[index]?.type === 'turn/start') {
      startIndex = index
      break
    }
  }
  const ending = events[endIndex]
  const tail = events.slice(Math.max(0, startIndex), endIndex + 1)
  return {
    endIndex,
    turn: ending.data?.turn,
    reason: ending.data?.reason,
    hadStep: tail.some(event => event?.type === 'step/start'),
    hadHuman: tail.some(isHumanMessage),
    hadAssistant: tail.some(event => event?.type === 'assistant/message'),
    hadToolCall: tail.some(event => event?.type === 'tool/call'),
    time: ending.time,
  }
}

/**
 * Decide whether a stored session should be continued when the Host starts.
 * Crash-orphaned and clean-shutdown turns need a normal continuation message;
 * failed retryable turns can use the product's empty continuation prompt.
 * @param events - complete durable log from `sessionQuery.readSession`.
 * @returns the recovery kind and cause, or null when the session is finished.
 */
export function bootRecoveryFor(events) {
  const report = lastTurnReport(events)
  if (report === null) return null
  if (!report.hadHuman) return null
  // A message already queued after the failed turn will run as soon as the
  // Session resumes; adding another continuation would duplicate the input.
  if (events.slice(report.endIndex + 1).some(event => (event?.type === 'user/message'
    && event.data?.surfaceOp === 'append')
    || (event?.type === 'agent/inbox/spliced' && (event.data?.inserted?.length ?? 0) > 0))) return null
  if (report.reason?.kind === 'interrupted') {
    return report.hadStep ? { kind: 'startup', cause: 'crash', code: null } : null
  }
  if (report.reason?.kind === 'aborted' && report.reason.reason?.kind === 'disposed') {
    return report.hadStep ? { kind: 'startup', cause: 'app-exit', code: null } : null
  }
  if (report.reason?.kind === 'error') {
    const code = report.reason.error?.code
    const category = classifyFailure(code)
    if (category === null) return null
    return { kind: category, cause: category === 'transient' ? 'network' : 'route', code }
  }
  return null
}

/**
 * Decide whether one live `turn/end` deserves automatic recovery.
 * Shutdown causes are ignored here because the Host itself is going away;
 * the next startup scan owns those.
 * @param reason - `turn/end.data.reason`.
 * @returns `{ kind, cause, code }` or null.
 */
export function liveRecoveryFor(reason) {
  if (reason?.kind !== 'error') return null
  const code = reason.error?.code
  const category = classifyFailure(code)
  if (category === null) return null
  return { kind: category, cause: category === 'transient' ? 'network' : 'route', code }
}
