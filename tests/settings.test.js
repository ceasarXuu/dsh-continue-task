import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_SETTINGS,
  SettingsError,
  normalizeSettings,
  pickFallback,
  retryDelayMs,
  routeKey,
  sameRoute,
} from '../host/settings.js'

test('defaults are complete and valid', () => {
  const settings = normalizeSettings({})
  assert.equal(settings.enabled, true)
  assert.equal(settings.startup.continuePrompt, DEFAULT_SETTINGS.startup.continuePrompt)
  assert.deepEqual(settings.failover.fallbacks, [])
})

test('normalizes and deduplicates fallbacks', () => {
  const settings = normalizeSettings({
    failover: {
      fallbacks: [
        { provider: ' opencode-go ', model: 'glm-5.3-flash' },
        { provider: 'opencode-go', model: 'glm-5.3-flash' },
        { provider: 'commandcode', model: 'z-ai/glm-5.3-flash', reasoningEffort: 'max' },
      ],
    },
  })
  assert.deepEqual(settings.failover.fallbacks, [
    { provider: 'opencode-go', model: 'glm-5.3-flash' },
    { provider: 'commandcode', model: 'z-ai/glm-5.3-flash', reasoningEffort: 'max' },
  ])
})

test('rejects invalid numbers and empty required text', () => {
  assert.throws(() => normalizeSettings({ startup: { maxSessions: 0 } }), SettingsError)
  assert.throws(() => normalizeSettings({ transient: { baseDelaySeconds: 'soon' } }), SettingsError)
  assert.throws(() => normalizeSettings({ startup: { continuePrompt: '   ' } }), SettingsError)
  assert.throws(() => normalizeSettings({ failover: { fallbacks: [{ provider: 'x', model: '' }] } }), SettingsError)
  assert.throws(() => normalizeSettings({ failover: { fallbacks: [{ model: 'm' }] } }), SettingsError)
})

test('retry delay grows, respects caps, and includes jitter', () => {
  const transient = { baseDelaySeconds: 15, maxDelaySeconds: 300, maxWaitMinutes: 30 }
  assert.equal(retryDelayMs(1, transient, 0, () => 0.5), 15_000)
  assert.equal(retryDelayMs(2, transient, 0, () => 0.5), 30_000)
  assert.equal(retryDelayMs(9, transient, 0, () => 0.5), 300_000)
  assert.equal(retryDelayMs(1, transient, 120_000, () => 0.5), 120_000)
  assert.ok(retryDelayMs(1, transient, 0, () => 0) < 15_000)
})

test('fallback selection skips the current route and used routes', () => {
  const current = { provider: 'a', model: 'one' }
  const fallbacks = [
    { provider: 'a', model: 'one' },
    { provider: 'b', model: 'two' },
    { provider: 'c', model: 'three' },
  ]
  const used = new Set([routeKey(fallbacks[1])])
  assert.deepEqual(pickFallback(current, fallbacks, used), { route: fallbacks[2], index: 2 })
  assert.equal(pickFallback(current, [], used), undefined)
  assert.equal(sameRoute(current, { provider: 'a', model: 'one' }), true)
})
