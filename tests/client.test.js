import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Fragment: 'Fragment',
  useState: value => [value, () => {}],
  useEffect: () => {},
  useRef: value => ({ current: value }),
  useSyncExternalStore: () => 0,
}

test('client bundle registers the settings page and its dictionaries', () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  let loaded
  const window = {
    __ModuleLoader__: {
      load(definition) { loaded = definition },
    },
  }
  const context = vm.createContext({
    window,
    fetch: async () => { throw new Error('unexpected fetch during module load') },
    console,
  })
  vm.runInContext(source, context)
  assert.equal(loaded.id, '@ceasarxuu/dsh-continue-task')
  const module = loaded.factory(name => {
    assert.equal(name, 'react')
    return React
  })
  assert.deepEqual(Array.from(module.inject), ['slots', 'locale'])
  const events = []
  const ctx = {
    effect(fn) { const disposer = fn(); return disposer },
    locale: {
      register(ns, dictionaries) {
        events.push(['register', ns, Object.keys(dictionaries)])
        return () => {}
      },
      bind(ns) { return (key, params) => params === undefined ? key : `${key}:${JSON.stringify(params)}` },
      subscribe() { return () => {} },
      getSnapshot() { return { revision: 0, active: 'zh' } },
    },
    slots: {
      inject(name, callback) {
        events.push(['inject', name])
        const disposer = callback()
        return disposer
      },
      register(options, component) {
        events.push(['register-slot', options.name, options.id, options.order, typeof component])
        return () => {}
      },
    },
  }
  module.apply(ctx)
  assert.deepEqual(events[0], ['register', 'continueTask', ['zh', 'en']])
  assert.deepEqual(events[1], ['inject', 'settings.section'])
  assert.deepEqual(events[2], ['register-slot', 'settings.section', 'continue-task', 72, 'function'])
})
