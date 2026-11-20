import assert from 'node:assert/strict'
import test from 'node:test'
import { createRoute, BASE } from '../host/routes.js'
import { DEFAULT_SETTINGS } from '../host/settings.js'
import { createStore } from '../host/store.js'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function harness(overrides = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'continue-task-route-'))
  const store = await createStore({ dir, logger: { warn() {}, info() {} } })
  const calls = []
  const runtime = {
    status: () => ({ enabled: true, settings: store.settings, pending: [], recent: [] }),
    scan: async () => { calls.push('scan'); return { scheduled: 1 } },
    cancel: id => { calls.push(['cancel', id]); return true },
  }
  const ctx = {
    connection: {
      browserPeer: 'browser',
      admit: () => ({ peer: overrides.peer ?? 'browser' }),
    },
    sessionController: {
      modelCatalog: async () => ({ default: { provider: 'p', model: 'm' }, groups: [{ id: 'p', name: 'P', models: [{ id: 'm', name: 'M' }] }], failures: [] }),
    },
  }
  const route = createRoute(ctx, runtime, store, { warn() {} })
  return {
    dir, store, calls, route,
    async close() { await store.close(); await rm(dir, { recursive: true, force: true }) },
  }
}

function request(method, path, body, type = 'application/json') {
  const payload = body === undefined ? '' : JSON.stringify(body)
  return {
    method,
    url: BASE + '/' + path,
    headers: type === null ? {} : { 'content-type': type },
    socket: { remoteAddress: '127.0.0.1' },
    async *[Symbol.asyncIterator]() {
      if (payload !== '') yield Buffer.from(payload)
    },
  }
}

async function call(route, req) {
  const response = { code: 0, headers: {}, body: '' }
  const res = {
    writeHead(code, headers) { response.code = code; response.headers = headers },
    end(body) { response.body = body },
  }
  await route(req, res)
  response.json = response.body ? JSON.parse(response.body) : undefined
  return response
}

test('GET state and models return the live snapshot', async () => {
  const fx = await harness()
  try {
    const state = await call(fx.route, request('GET', 'state'))
    assert.equal(state.code, 200)
    assert.equal(state.json.enabled, true)
    const models = await call(fx.route, request('GET', 'models'))
    assert.equal(models.code, 200)
    assert.equal(models.json.groups[0].models[0].id, 'm')
  } finally { await fx.close() }
})

test('POST settings validates and persists', async () => {
  const fx = await harness()
  try {
    const bad = await call(fx.route, request('POST', 'settings', { settings: { startup: { maxSessions: 0 } } }))
    assert.equal(bad.code, 400)
    assert.match(bad.json.error, /最多恢复的会话数/)
    const shape = await call(fx.route, request('POST', 'settings', { foo: 1 }))
    assert.equal(shape.code, 400)
    const good = await call(fx.route, request('POST', 'settings', { settings: { startup: { maxSessions: 3 } } }))
    assert.equal(good.code, 200)
    assert.equal(fx.store.settings.startup.maxSessions, 3)
  } finally { await fx.close() }
})

test('POST scan and cancel reach the runtime', async () => {
  const fx = await harness()
  try {
    const scan = await call(fx.route, request('POST', 'scan', {}))
    assert.equal(scan.code, 200)
    assert.equal(scan.json.result.scheduled, 1)
    const cancel = await call(fx.route, request('POST', 'cancel', { sessionId: 's1' }))
    assert.equal(cancel.code, 200)
    assert.deepEqual(fx.calls.at(-1), ['cancel', 's1'])
  } finally { await fx.close() }
})

test('POST reset restores one section and preserves fallback routes', async () => {
  const fx = await harness()
  try {
    fx.store.setSettings({
      startup: { graceSeconds: 9 },
      transient: { maxAttempts: 3 },
      failover: { maxSwitches: 1, fallbacks: [{ provider: 'backup', model: 'safe' }] },
    })
    const reset = await call(fx.route, request('POST', 'reset', { scope: 'startup' }))
    assert.equal(reset.code, 200)
    assert.equal(fx.store.settings.startup.graceSeconds, DEFAULT_SETTINGS.startup.graceSeconds)
    assert.equal(fx.store.settings.transient.maxAttempts, 3)
    assert.deepEqual(fx.store.settings.failover.fallbacks, [{ provider: 'backup', model: 'safe' }])
    const all = await call(fx.route, request('POST', 'reset', { scope: 'all' }))
    assert.equal(all.code, 200)
    assert.equal(fx.store.settings.startup.graceSeconds, DEFAULT_SETTINGS.startup.graceSeconds)
    assert.deepEqual(fx.store.settings.failover.fallbacks, [{ provider: 'backup', model: 'safe' }])
    const bad = await call(fx.route, request('POST', 'reset', { scope: 'nope' }))
    assert.equal(bad.code, 400)
  } finally { await fx.close() }
})

test('rejects non-JSON bodies and non-browser peers', async () => {
  const fx = await harness()
  try {
    const nonJson = await call(fx.route, request('POST', 'settings', { enabled: false }, 'text/plain'))
    assert.equal(nonJson.code, 400)
    const missingType = await call(fx.route, request('POST', 'settings', { enabled: false }, null))
    assert.equal(missingType.code, 400)
    const foreign = await harness({ peer: 'someone-else' })
    try {
      const denied = await call(foreign.route, request('GET', 'state'))
      assert.equal(denied.code, 403)
    } finally { await foreign.close() }
  } finally { await fx.close() }
})
