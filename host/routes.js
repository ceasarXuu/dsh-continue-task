/**
 * Local settings API for the Task recovery settings page.
 * Same-origin browser traffic only, JSON request bodies, no-store responses.
 * @module dsh-continue-task/routes
 */
import { DEFAULT_SETTINGS, SettingsError } from './settings.js'

export const BASE = '/plugin/continue-task'
const MAX_BODY = 128 * 1024

function reply(res, code, value) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}

async function json(req) {
  const rawType = req.headers['content-type']
  const type = typeof rawType === 'string' ? rawType.split(';')[0].trim().toLowerCase() : ''
  if (type !== 'application/json') throw new SettingsError('请以 JSON 提交请求。')
  const declared = Number(req.headers['content-length'])
  if (Number.isFinite(declared) && declared > MAX_BODY) {
    req.destroy()
    throw new SettingsError('请求内容过长。')
  }
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) {
      req.destroy()
      throw new SettingsError('请求内容过长。')
    }
    chunks.push(chunk)
  }
  let value
  try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new SettingsError('请求内容无法解析。')
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new SettingsError('请求内容无效。')
  }
  return value
}

function localBrowser(ctx, req, res) {
  const admission = ctx.connection?.admit(req)
  if (admission?.rejection !== undefined) {
    reply(res, admission.rejection, { error: 'DSH 未授权当前浏览器访问。' })
    return false
  }
  const browserPeer = ctx.connection?.browserPeer
  const address = req.socket?.remoteAddress ?? ''
  const loopback = address === '::1' || /^(?:::ffff:)?127\./i.test(address)
  if (browserPeer !== undefined && admission?.peer !== browserPeer) {
    reply(res, 403, { error: '任务续传设置仅向本机 DSH 浏览器界面开放。' })
    return false
  }
  if (!loopback) {
    reply(res, 403, { error: '任务续传设置仅向本机 DSH 浏览器界面开放。' })
    return false
  }
  return true
}

function modelGroups(catalog) {
  return (catalog?.groups ?? []).map(group => ({
    provider: group.id,
    name: group.name,
    models: (group.models ?? []).map(model => ({
      id: model.id,
      name: model.name,
      ...model.description === undefined ? {} : { description: model.description },
      ...model.reasoning?.efforts?.length
        ? { efforts: model.reasoning.efforts.map(effort => effort.id) }
        : {},
    })),
  }))
}

/**
 * Resolve one reset scope over the current settings, preserving the user's
 * fallback routes because they are content, not policy defaults.
 * @param scope - all, startup, transient, or failover.
 * @param current - current resolved settings.
 * @returns a complete settings candidate.
 */
function resetSettings(scope, current) {
  const fallbacks = current.failover.fallbacks
  if (scope === 'startup') return { ...current, startup: { ...DEFAULT_SETTINGS.startup } }
  if (scope === 'transient') return { ...current, transient: { ...DEFAULT_SETTINGS.transient } }
  if (scope === 'failover') return { ...current, failover: { ...DEFAULT_SETTINGS.failover, fallbacks } }
  if (scope === 'all') return { ...DEFAULT_SETTINGS, failover: { ...DEFAULT_SETTINGS.failover, fallbacks } }
  throw new SettingsError('未知的恢复范围。')
}

/**
 * Build the prefix route handler.
 * @param ctx - Host context carrying connection and sessionController.
 * @param runtime - recovery runtime.
 * @param store - durable store.
 * @param logger - host logger.
 * @returns an HTTP handler for `BASE`.
 */
export function createRoute(ctx, runtime, store, logger) {
  return async (req, res) => {
    try {
      if (!localBrowser(ctx, req, res)) return
      const path = new URL(req.url, 'http://localhost').pathname.slice(BASE.length + 1)
      if (req.method === 'GET') {
        if (path === 'state') return reply(res, 200, runtime.status())
        if (path === 'models') {
          const catalog = await ctx.sessionController.modelCatalog()
          return reply(res, 200, {
            default: catalog?.default ?? null,
            groups: modelGroups(catalog),
            failures: catalog?.failures ?? [],
          })
        }
        return reply(res, 404, { error: '找不到这个设置接口。' })
      }
      if (req.method !== 'POST') return reply(res, 405, { error: '不支持的请求方法。' })
      const body = await json(req)
      if (path === 'settings') {
        const candidate = body.settings
        if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) {
          return reply(res, 400, { error: '请求中缺少 settings 对象。' })
        }
        try {
          store.setSettings(candidate)
        } catch (error) {
          if (error instanceof SettingsError) return reply(res, 400, { error: error.message })
          throw error
        }
        await store.flush()
        return reply(res, 200, runtime.status())
      }
      if (path === 'scan') {
        const result = await runtime.scan({ manual: true })
        return reply(res, 200, { result, status: runtime.status() })
      }
      if (path === 'reset') {
        let next
        try {
          next = resetSettings(typeof body.scope === 'string' ? body.scope : '', store.settings)
        } catch (error) {
          if (error instanceof SettingsError) return reply(res, 400, { error: error.message })
          throw error
        }
        store.setSettings(next)
        await store.flush()
        return reply(res, 200, runtime.status())
      }
      if (path === 'cancel') {
        if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
          return reply(res, 400, { error: '缺少会话 ID。' })
        }
        const cancelled = runtime.cancel(body.sessionId)
        return reply(res, 200, { cancelled, status: runtime.status() })
      }
      return reply(res, 404, { error: '找不到这个设置接口。' })
    } catch (error) {
      if (error instanceof SettingsError) return reply(res, 400, { error: error.message })
      logger?.warn(`continue-task: settings request failed: ${String(error?.message ?? error)}`)
      reply(res, 500, { error: '任务续传暂时无法完成操作，请检查 DSH 宿主日志。' })
    }
  }
}
