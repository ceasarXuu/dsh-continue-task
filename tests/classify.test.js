import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bootRecoveryFor,
  classifyFailure,
  lastTurnReport,
  liveRecoveryFor,
} from '../host/classify.js'

const user = { type: 'user/message', seq: 2, time: 10, surfaceOp: 'append', data: { source: { kind: 'user' }, content: [] } }

function log(turnEnd) {
  return [
    { type: 'turn/start', seq: 1, time: 1, data: { turn: 1 } },
    user,
    { type: 'step/start', seq: 3, time: 3, data: { turn: 1, step: 1 } },
    turnEnd,
  ]
}

test('classifies provider-neutral and HTTP failures', () => {
  assert.equal(classifyFailure('TRANSPORT'), 'transient')
  assert.equal(classifyFailure('rate_limit'), 'transient')
  assert.equal(classifyFailure('HTTP_503'), 'transient')
  assert.equal(classifyFailure('HTTP_429'), 'transient')
  assert.equal(classifyFailure('QUOTA'), 'failover')
  assert.equal(classifyFailure('HTTP_402'), 'failover')
  assert.equal(classifyFailure('INVALID_REQUEST'), null)
})

test('reports the final turn boundaries and admitted work', () => {
  const report = lastTurnReport(log({ type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason: { kind: 'completed' } } }))
  assert.equal(report.turn, 1)
  assert.equal(report.hadStep, true)
  assert.equal(report.hadHuman, true)
  assert.equal(report.reason.kind, 'completed')
})

test('crash-interrupted work is continued at startup', () => {
  const recovery = bootRecoveryFor(log({ type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason: { kind: 'interrupted' } } }))
  assert.deepEqual(recovery, { kind: 'startup', cause: 'crash', code: null })
})

test('a clean shutdown mid-turn is continued at startup', () => {
  const reason = { kind: 'aborted', reason: { kind: 'disposed' } }
  const recovery = bootRecoveryFor(log({ type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason } }))
  assert.deepEqual(recovery, { kind: 'startup', cause: 'app-exit', code: null })
})

test('a user stop is never continued', () => {
  const reason = { kind: 'aborted', reason: { kind: 'user' } }
  assert.equal(bootRecoveryFor(log({ type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason } })), null)
})

test('retryable and route failures are recovered at startup', () => {
  const transient = bootRecoveryFor(log({
    type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason: { kind: 'error', error: { code: 'TRANSPORT', message: 'offline' } } },
  }))
  assert.deepEqual(transient, { kind: 'transient', cause: 'network', code: 'TRANSPORT' })
  const quota = bootRecoveryFor(log({
    type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason: { kind: 'error', error: { code: 'QUOTA', message: 'no balance' } } },
  }))
  assert.deepEqual(quota, { kind: 'failover', cause: 'route', code: 'QUOTA' })
})

test('queued input after the failed turn suppresses startup recovery', () => {
  const events = log({ type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason: { kind: 'error', error: { code: 'TRANSPORT', message: 'offline' } } } })
  events.push({ type: 'user/message', seq: 5, time: 5, surfaceOp: 'append', data: { source: { kind: 'user' }, content: [] } })
  assert.equal(bootRecoveryFor(events), null)
})

test('queued inbox input after the failed turn suppresses startup recovery', () => {
  const events = log({ type: 'turn/end', seq: 4, time: 4, data: { turn: 1, reason: { kind: 'interrupted' } } })
  events.push({ type: 'agent/inbox/spliced', seq: 5, time: 5, data: { inserted: [{ id: 'm1' }] } })
  assert.equal(bootRecoveryFor(events), null)
})

test('a turn without human work is not resumed', () => {
  const events = [
    { type: 'turn/start', seq: 1, time: 1, data: { turn: 1 } },
    { type: 'step/start', seq: 2, time: 2, data: { turn: 1, step: 1 } },
    { type: 'turn/end', seq: 3, time: 3, data: { turn: 1, reason: { kind: 'interrupted' } } },
  ]
  assert.equal(bootRecoveryFor(events), null)
})

test('live recovery only handles terminal errors', () => {
  assert.equal(liveRecoveryFor({ kind: 'completed' }), null)
  assert.equal(liveRecoveryFor({ kind: 'aborted', reason: { kind: 'disposed' } }), null)
  assert.deepEqual(liveRecoveryFor({ kind: 'error', error: { code: 'TIMEOUT', message: 'slow' } }),
    { kind: 'transient', cause: 'network', code: 'TIMEOUT' })
})
