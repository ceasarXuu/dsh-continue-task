import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { mock } from 'node:test'
import { createStore } from '../host/store.js'
import { createRecoveryRuntime } from '../host/recovery.js'

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'continue-task-'))
  const store = await createStore({ dir, logger: { warn() {}, info() {} } })
  store.setSettings({
    enabled: true,
    startup: { enabled: false, graceSeconds: 0 },
    transient: { enabled: true, baseDelaySeconds: 5, maxDelaySeconds: 5, maxAttempts: 2, maxWaitMinutes: 30 },
    failover: { enabled: true, maxSwitches: 1, fallbacks: [{ provider: 'backup', model: 'safe' }] },
  })
  const listeners = []
  const calls = []
  let currentRoute = { provider: 'main', model: 'primary' }
  const agent = {
    session: { id: 'session-1', header: {} },
    model: {
      current: () => currentRoute,
      select: route => { currentRoute = route; calls.push({ type: 'select', route }) },
    },
  }
  let listed = []
  const ctx = {
    logger: { warn() {}, info() {} },
    on(name, listener) {
      listeners.push({ name, listener })
      return () => {}
    },
    get(name) {
      if (name === 'workspaceRegistry') return { archivedSessionIds: [] }
      return undefined
    },
    sessionController: {
      async list() { return { items: listed } },
      async resolveAgent() { return { agent } },
      async prompt(request) { calls.push({ type: 'prompt', request }); return { accepted: true } },
    },
    sessionQuery: {
      async readSession() { return { events: [] } },
    },
    llm: {
      async resolveCallConfig(route) { return route },
    },
  }
  const runtime = createRecoveryRuntime(ctx, { store, logger: ctx.logger })
  await runtime.start()
  return {
    dir, store, runtime, calls, agent, ctx,
    emit(session, event) {
      for (const entry of listeners) if (entry.name === 'session/event') entry.listener(session, event)
    },
    setListed(items) { listed = items },
    async close() {
      await runtime.stop()
      await store.close()
      await rm(dir, { recursive: true, force: true })
    },
  }
}

test('transient failure is retried and then stops at the attempt budget', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
  const fx = await fixture()
  try {
    const session = fx.agent.session
    const error = (code) => ({ type: 'turn/end', data: { turn: 1, reason: { kind: 'error', error: { code, message: code } } } })
    fx.emit(session, error('TRANSPORT'))
    assert.equal(fx.runtime.status().pending.length, 1)
    mock.timers.tick(6_000)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(fx.calls.filter(call => call.type === 'prompt').length, 1)
    assert.deepEqual(fx.calls.find(call => call.type === 'prompt').request.content, [])
    fx.emit(session, error('TRANSPORT'))
    mock.timers.tick(10_000)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(fx.calls.filter(call => call.type === 'prompt').length, 2)
    fx.emit(session, error('TRANSPORT'))
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(fx.calls.filter(call => call.type === 'prompt').length, 2)
    assert.ok(fx.store.state.recent.some(entry => entry.action === 'stopped'))
  } finally {
    await fx.close()
    mock.timers.reset()
  }
})

test('a manual cancel clears the pending timer and attempt budget', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
  const fx = await fixture()
  try {
    fx.emit(fx.agent.session, { type: 'turn/end', data: { turn: 1, reason: { kind: 'error', error: { code: 'TRANSPORT', message: 'offline' } } } })
    assert.equal(fx.runtime.status().pending.length, 1)
    assert.equal(fx.runtime.cancel('session-1'), true)
    assert.equal(fx.runtime.status().pending.length, 0)
    assert.equal(fx.store.state.sessions['session-1'], undefined)
    mock.timers.tick(300_000)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(fx.calls.filter(call => call.type === 'prompt').length, 0)
    assert.ok(fx.store.state.recent.some(entry => entry.action === 'cancelled'))
  } finally {
    await fx.close()
    mock.timers.reset()
  }
})

test('quota failure selects the fallback route before continuing', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
  const fx = await fixture()
  try {
    const session = fx.agent.session
    fx.emit(session, { type: 'turn/end', data: { turn: 1, reason: { kind: 'error', error: { code: 'QUOTA', message: 'no balance' } } } })
    mock.timers.tick(2_000)
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(fx.calls.find(call => call.type === 'select').route, { provider: 'backup', model: 'safe' })
    const prompt = fx.calls.find(call => call.type === 'prompt')
    assert.equal(prompt.request.content.length, 1)
    assert.match(prompt.request.content[0].text, /备用|继续/)
    assert.equal(fx.runtime.status().pending.length, 0)
  } finally {
    await fx.close()
    mock.timers.reset()
  }
})

test('an admission retry keeps the already selected fallback route', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
  const fx = await fixture()
  try {
    let failures = 1
    fx.ctx.sessionController.prompt = async request => {
      fx.calls.push({ type: 'prompt', request })
      if (failures > 0) {
        failures -= 1
        throw Object.assign(new Error('generation continuation is unavailable'), { code: 'session/agent-busy' })
      }
      return { accepted: true }
    }
    fx.emit(fx.agent.session, { type: 'turn/end', data: { turn: 1, reason: { kind: 'error', error: { code: 'QUOTA', message: 'no balance' } } } })
    mock.timers.tick(2_000)
    await new Promise(resolve => setImmediate(resolve))
    mock.timers.tick(3_000)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(fx.calls.filter(call => call.type === 'select').length, 1)
    assert.equal(fx.calls.filter(call => call.type === 'prompt').length, 2)
    assert.equal(fx.store.state.sessions['session-1'].attempts, 1)
  } finally {
    await fx.close()
    mock.timers.reset()
  }
})

test('a native continuation rejection is not retried into a duplicate message', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
  const fx = await fixture()
  try {
    fx.ctx.sessionController.prompt = async request => {
      fx.calls.push({ type: 'prompt', request })
      throw Object.assign(new Error('generation continuation is unavailable'), {
        code: 'session/agent-busy',
        details: { reason: 'NO_CONTINUABLE_FAILURE_OR_PENDING_INPUT' },
      })
    }
    fx.emit(fx.agent.session, { type: 'turn/end', data: { turn: 1, reason: { kind: 'error', error: { code: 'TRANSPORT', message: 'offline' } } } })
    mock.timers.tick(6_000)
    await new Promise(resolve => setImmediate(resolve))
    mock.timers.tick(60_000)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(fx.calls.filter(call => call.type === 'prompt').length, 1)
    assert.ok(fx.store.state.recent.some(entry => entry.action === 'stopped'))
  } finally {
    await fx.close()
    mock.timers.reset()
  }
})

test('manual scan continues an interrupted stored session with a text prompt', async () => {
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
  const fx = await fixture()
  try {
    fx.setListed([{ sessionId: 'session-1', updatedAt: Date.now(), running: false, blank: false, projections: { values: { title: '被中断的任务' } } }])
    fx.store.setSettings({
      startup: { enabled: false, graceSeconds: 0, lookbackMinutes: 30, maxSessions: 2, continuePrompt: '继续。' },
    })
    fx.ctx.sessionQuery.readSession = async () => ({
      events: [
        { type: 'turn/start', data: { turn: 1 } },
        { type: 'user/message', surfaceOp: 'append', data: { source: { kind: 'user' }, content: [] } },
        { type: 'step/start', data: { turn: 1, step: 1 } },
        { type: 'turn/end', data: { turn: 1, reason: { kind: 'interrupted' } } },
      ],
    })
    const result = await fx.runtime.scan({ manual: true })
    assert.equal(result.scheduled, 1)
    assert.equal(fx.runtime.status().pending[0].title, '被中断的任务')
    mock.timers.tick(0)
    await new Promise(resolve => setImmediate(resolve))
    const prompt = fx.calls.find(call => call.type === 'prompt')
    assert.deepEqual(prompt.request.content, [{ type: 'text', text: '继续。' }])
  } finally {
    await fx.close()
    mock.timers.reset()
  }
})
