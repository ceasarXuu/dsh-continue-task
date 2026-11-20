/**
 * Host half of Task recovery.
 *
 * Owns the durable settings/attempt store, the recovery runtime, and the local
 * settings API used by the Web settings page. The browser half registers the
 * page; it carries no recovery logic.
 * @module dsh-continue-task
 */
import { createStore, resolveStateDir } from './host/store.js'
import { createRecoveryRuntime } from './host/recovery.js'
import { BASE, createRoute } from './host/routes.js'

export const name = 'continue-task'
export const inject = ['sessionController', 'sessionQuery', 'llm']

/**
 * Mount the recovery runtime.
 * @param ctx - Host context.
 * @param config - optional bundle row config with `stateDir` and initial `settings`.
 * @returns when the runtime and its settings route are mounted.
 */
export async function apply(ctx, config = {}) {
  const logger = ctx.logger
  const dir = resolveStateDir(ctx, config?.stateDir)
  const store = await createStore({
    dir,
    logger,
    initialSettings: config?.settings,
  })
  const runtime = createRecoveryRuntime(ctx, { store, logger })

  ctx.effect(() => () => (async () => {
    await runtime.stop()
    await store.close()
  })(), 'continue-task: runtime')

  ctx.effect(() => {
    const webServer = ctx.get('webServer')
    const connection = ctx.get('connection')
    if (webServer === undefined || connection === undefined) return
    return webServer.register({
      kind: 'prefix',
      path: BASE,
      handler: createRoute(ctx, runtime, store, logger),
    })
  }, 'continue-task: settings route')

  await runtime.start()
  logger?.info(`continue-task: state directory ${dir}`)
}
