/**
 * Browser half of Task recovery: one Settings page that edits Host settings,
 * shows pending automatic recoveries, and lets the user scan or cancel one.
 * Registered through the shared client module table; no Harness packages are
 * imported at runtime except React.
 */
window.__ModuleLoader__.load({
  id: '@ceasarxuu/dsh-continue-task',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'continueTask'
    const BASE = '/plugin/continue-task'
    const zh = {
      nav: '任务续传', title: '任务续传', subtitle: '应用重启、网络中断或额度不足后，自动把未完成的任务继续下去。所有恢复都通过普通会话消息完成，记录可在对话中查看。',
      enabled: '启用任务续传', enabledHint: '关闭后不再检测或恢复任何会话。',
      recoveryMessage: '通用恢复提示语', recoveryMessageHint: '网络、额度等非重启类恢复会在对话中追加这条消息。',
      startup: '应用启动后继续', startupHint: '应用上次退出时仍在执行的任务，会在下次启动后自动继续。只扫描最近使用过的会话。',
      startupEnabled: '启动时自动继续', grace: '启动等待', lookback: '只回看最近', maxSessions: '每次最多恢复', prompt: '续传提示语', promptHint: '这条消息会进入对话，告诉模型上一轮被中断并从中断处继续。', minutes: '分钟', seconds: '秒', sessions: '个会话',
      transient: '网络中断自动重试', transientHint: '模型请求因网络、超时、服务端错误或限流失败时，按指数退避重试；网络恢复后的下一次重试会成功。',
      transientEnabled: '自动重试', maxAttempts: '最多重试', attempts: '次', baseDelay: '首次等待', maxDelay: '单次最长等待', maxWait: '总等待上限',
      failover: '额度不足时切换模型', failoverHint: '当前服务商额度耗尽、凭据失效或模型不可用时，先切换到备用模型再继续当前任务。',
      failoverEnabled: '自动切换模型', maxSwitches: '最多切换', switches: '次', fallbacks: '备用模型', addFallback: '添加备用模型', provider: '服务商', model: '模型', effort: '推理强度', defaultEffort: '默认', remove: '移除', noFallbacks: '还没有备用模型。额度不足时不会自动切换。', catalogUnavailable: '模型目录暂不可用，请直接填写服务商和模型 ID。',
      status: '运行状态', statusHint: '待恢复的会话和最近动作。页面每 5 秒刷新一次。', pending: '待恢复', noPending: '当前没有等待中的恢复。', recent: '最近动作', noRecent: '还没有恢复动作。', lastScan: '上次扫描', never: '尚未扫描', scanning: '正在扫描…', cancel: '取消', attemptsLabel: '已尝试',
      save: '保存设置', saving: '正在保存…', saved: '设置已保存。', reset: '撤销修改', scan: '立即扫描并恢复', scanRunning: '正在扫描…', scanDone: '扫描完成，安排了 {count} 个恢复。', scanNone: '扫描完成，没有需要恢复的会话。', scanBusy: '正在扫描，请稍后再试。',
      loadFailed: '无法读取设置：{message}', saveFailed: '保存失败：{message}', scanFailed: '扫描失败：{message}', cancelFailed: '取消失败：{message}', dirty: '有未保存的修改。', cancelDone: '已取消该会话的待恢复动作。', cancelGone: '恢复已经开始，无法再取消。',
      kindStartup: '启动续传', kindTransient: '网络重试', kindFailover: '模型切换', kindScan: '扫描', kindManual: '手动', kindEvent: '事件',
      actContinued: '已继续', actScheduled: '已安排', actStopped: '已停止', actSkipped: '已跳过', actCancelled: '已取消', actRetrying: '准备重试', actFailed: '失败', actScan: '扫描',
    }
    const en = {
      nav: 'Task recovery', title: 'Task recovery', subtitle: 'Keeps unfinished work going after an app restart, a network failure, or an exhausted quota. Every recovery is an ordinary session message, visible in the conversation.',
      enabled: 'Enable task recovery', enabledHint: 'When off, no session is inspected or resumed.',
      recoveryMessage: 'General recovery message', recoveryMessageHint: 'Network and quota recoveries append this message to the conversation.',
      startup: 'Continue after app start', startupHint: 'Tasks that were still running when the app last exited continue after the next start. Only recently used sessions are scanned.',
      startupEnabled: 'Continue on startup', grace: 'Startup wait', lookback: 'Look back', maxSessions: 'At most', prompt: 'Continuation message', promptHint: 'This message enters the conversation and tells the model that the previous turn was interrupted.', minutes: 'minutes', seconds: 'seconds', sessions: 'sessions',
      transient: 'Retry after network failures', transientHint: 'Network, timeout, server, and rate-limit failures retry with exponential backoff; the first retry after connectivity returns succeeds.',
      transientEnabled: 'Automatic retry', maxAttempts: 'Max retries', attempts: 'attempts', baseDelay: 'First wait', maxDelay: 'Max wait', maxWait: 'Total budget',
      failover: 'Switch model when quota runs out', failoverHint: 'When the current provider is out of quota, its credentials fail, or the model is unavailable, switch to a fallback route and continue.',
      failoverEnabled: 'Automatic model switch', maxSwitches: 'Max switches', switches: 'switches', fallbacks: 'Fallback models', addFallback: 'Add fallback', provider: 'Provider', model: 'Model', effort: 'Reasoning effort', defaultEffort: 'Default', remove: 'Remove', noFallbacks: 'No fallback configured; quota failures will not switch models.', catalogUnavailable: 'The model catalog is unavailable; enter the provider and model id directly.',
      status: 'Runtime status', statusHint: 'Pending recoveries and recent actions. Refreshed every 5 seconds.', pending: 'Pending', noPending: 'No recovery is waiting.', recent: 'Recent actions', noRecent: 'No recovery action yet.', lastScan: 'Last scan', never: 'Never scanned', scanning: 'Scanning…', cancel: 'Cancel', attemptsLabel: 'Attempts',
      save: 'Save settings', saving: 'Saving…', saved: 'Settings saved.', reset: 'Discard changes', scan: 'Scan and recover now', scanRunning: 'Scanning…', scanDone: 'Scan finished; {count} recovery action(s) scheduled.', scanNone: 'Scan finished; nothing to recover.', scanBusy: 'A scan is already running; try again shortly.',
      loadFailed: 'Cannot read settings: {message}', saveFailed: 'Save failed: {message}', scanFailed: 'Scan failed: {message}', cancelFailed: 'Cancel failed: {message}', dirty: 'You have unsaved changes.', cancelDone: 'The pending recovery for that session was cancelled.', cancelGone: 'Recovery already started; it can no longer be cancelled.',
      kindStartup: 'Startup', kindTransient: 'Network retry', kindFailover: 'Model switch', kindScan: 'Scan', kindManual: 'Manual', kindEvent: 'Event',
      actContinued: 'Continued', actScheduled: 'Scheduled', actStopped: 'Stopped', actSkipped: 'Skipped', actCancelled: 'Cancelled', actRetrying: 'Retrying', actFailed: 'Failed', actScan: 'Scan',
    }

    async function api(path, body, signal) {
      const response = await fetch(`${BASE}/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        headers: body === undefined ? { Accept: 'application/json' } : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
        signal,
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload === null) throw new Error(payload?.error ?? 'request failed')
      return payload
    }

    const css = `
      .ct-page { display: grid; gap: 14px; max-width: 780px; color: var(--dsw-alias-label-primary); }
      .ct-head h2 { margin: 0 0 4px; font-size: 18px; font-weight: 600; }
      .ct-sub { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 1.6; }
      .ct-section { display: grid; gap: 10px; padding: 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); }
      .ct-section h3 { margin: 0; font-size: 14px; font-weight: 600; }
      .ct-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.6; }
      .ct-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
      .ct-row-text { min-width: 0; display: grid; gap: 3px; }
      .ct-label { font-size: 13px; }
      .ct-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(165px, 1fr)); gap: 10px; }
      .ct-field { display: grid; gap: 4px; min-width: 0; }
      .ct-field > span { color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .ct-page input, .ct-page select, .ct-page textarea { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; }
      .ct-page input:focus, .ct-page select:focus, .ct-page textarea:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -1px; }
      .ct-page textarea { min-height: 74px; resize: vertical; line-height: 1.5; }
      .ct-switch { position: relative; flex: none; width: 38px; height: 22px; padding: 0; border: 0; border-radius: 999px; background: var(--dsw-alias-border-l2); cursor: pointer; transition: background .15s; }
      .ct-switch.ct-on { background: var(--dsw-alias-brand-primary); }
      .ct-switch.ct-on .ct-knob { background: var(--dsw-alias-label-primary-inverted, #fff); }
      .ct-knob { position: absolute; inset-block-start: 2px; inset-inline-start: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: inset-inline-start .15s; }
      .ct-switch.ct-on .ct-knob { inset-inline-start: 18px; }
      .ct-fallback { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; gap: 8px; align-items: end; }
      .ct-fallback-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
      .ct-index { align-self: center; color: var(--dsw-alias-label-secondary); font-size: 12px; text-align: center; }
      .ct-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      .ct-btn, .ct-link { font: inherit; cursor: pointer; }
      .ct-btn { padding: 7px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-size: 13px; }
      .ct-btn:disabled { opacity: .55; cursor: default; }
      .ct-btn.ct-primary { border-color: transparent; background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary)); color: var(--dsw-alias-label-primary-inverted, #fff); }
      .ct-footer { position: sticky; bottom: 0; z-index: 1; padding-block: 10px 2px; border-block-start: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); }
      .ct-link { padding: 0; border: 0; background: none; color: var(--dsw-alias-brand-primary); font-size: 12px; }
      .ct-link:disabled { opacity: .5; cursor: default; }
      .ct-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
      .ct-item { display: grid; gap: 2px; padding-block-start: 6px; border-block-start: 1px solid var(--dsw-alias-border-l1); font-size: 12px; }
      .ct-item:first-child { padding-block-start: 0; border-block-start: 0; }
      .ct-item-head { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
      .ct-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
      .ct-badge { padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); font-size: 11px; }
      .ct-omit { color: var(--dsw-alias-label-secondary); font-size: 12px; }
      .ct-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; }
      .ct-ok { color: var(--dsw-alias-state-success-primary); font-size: 12px; }
    `

    function useLocale(ctx) {
      return React.useSyncExternalStore(
        listener => ctx.locale.subscribe(listener),
        () => ctx.locale.getSnapshot().revision,
      )
    }

    function useStyle() {
      React.useEffect(() => {
        const tag = document.createElement('style')
        tag.textContent = css
        document.head.append(tag)
        return () => tag.remove()
      }, [])
    }

    function timeText(value, locale) {
      if (!value) return ''
      return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
    }

    function Section({ title, hint, children }) {
      return h('section', { className: 'ct-section' },
        h('h3', null, title),
        hint ? h('p', { className: 'ct-hint' }, hint) : null,
        children)
    }

    function Switch({ label, hint, checked, onChange }) {
      const toggle = () => onChange(!checked)
      return h('div', { className: 'ct-row' },
        h('div', { className: 'ct-row-text', onClick: toggle, style: { cursor: 'pointer' } },
          h('span', { className: 'ct-label' }, label),
          hint ? h('span', { className: 'ct-hint' }, hint) : null),
        h('button', {
          type: 'button', role: 'switch', 'aria-checked': checked ? 'true' : 'false',
          'aria-label': label, className: 'ct-switch' + (checked ? ' ct-on' : ''),
          onClick: toggle,
        }, h('span', { className: 'ct-knob' })))
    }

    function NumberField({ label, value, unit, min, max, disabled, onChange }) {
      return h('label', { className: 'ct-field' },
        h('span', null, label),
        h('input', {
          type: 'number', value: value, min, max, step: 1, disabled,
          onChange: event => {
            const next = Number(event.target.value)
            if (Number.isInteger(next)) onChange(next)
          },
        }),
        unit ? h('span', { className: 'ct-omit' }, unit) : null)
    }

    function fallbackOptions(models, provider) {
      const groups = models?.groups ?? []
      const providers = groups.map(group => group.provider)
      if (provider && !providers.includes(provider)) providers.unshift(provider)
      const group = groups.find(entry => entry.provider === provider)
      return { providers, models: group?.models ?? [] }
    }

    function FallbackRows({ t, models, fallbacks, disabled, onChange }) {
      const rows = []
      for (let index = 0; index < fallbacks.length; index += 1) {
        const route = fallbacks[index]
        const options = fallbackOptions(models, route.provider)
        const set = patch => onChange(fallbacks.map((entry, position) => position === index ? { ...entry, ...patch } : entry))
        const modelChoices = options.models.map(model => ({ id: model.id, name: model.name }))
        if (route.model && !modelChoices.some(model => model.id === route.model)) {
          modelChoices.unshift({ id: route.model, name: route.model })
        }
        const selected = options.models.find(model => model.id === route.model)
        const efforts = selected?.efforts ?? []
        rows.push(h('div', { className: 'ct-fallback', key: index },
          h('span', { className: 'ct-index' }, String(index + 1)),
          h('div', { className: 'ct-fallback-fields' },
            h('label', { className: 'ct-field' },
              h('span', null, t('provider')),
              options.providers.length > 0
                ? h('select', {
                  value: route.provider, disabled,
                  onChange: event => set({ provider: event.target.value, model: '', reasoningEffort: undefined }),
                },
                h('option', { value: '', disabled: true }, '—'),
                options.providers.map(provider => h('option', { key: provider, value: provider }, provider)))
                : h('input', { type: 'text', value: route.provider, disabled, onChange: event => set({ provider: event.target.value }) })),
            h('label', { className: 'ct-field' },
              h('span', null, t('model')),
              options.models.length > 0
                ? h('select', {
                  value: route.model, disabled,
                  onChange: event => set({ model: event.target.value, reasoningEffort: undefined }),
                },
                h('option', { value: '', disabled: true }, '—'),
                modelChoices.map(model => h('option', { key: model.id, value: model.id }, model.name)))
                : h('input', { type: 'text', value: route.model, disabled, onChange: event => set({ model: event.target.value }) })),
            efforts.length > 0
              ? h('label', { className: 'ct-field' },
                h('span', null, t('effort')),
                h('select', {
                  value: route.reasoningEffort ?? '', disabled,
                  onChange: event => set({ reasoningEffort: event.target.value || undefined }),
                },
                h('option', { value: '' }, t('defaultEffort')),
                efforts.map(effort => h('option', { key: effort, value: effort }, effort))))
              : null),
          h('button', {
            type: 'button', className: 'ct-link', disabled,
            onClick: () => onChange(fallbacks.filter((_, position) => position !== index)),
          }, t('remove'))))
      }
      return h('div', { style: { display: 'grid', gap: '8px' } },
        fallbacks.length === 0 ? h('p', { className: 'ct-omit' }, t('noFallbacks')) : rows,
        fallbacks.length < 3
          ? h('div', { className: 'ct-actions' },
            h('button', {
              type: 'button', className: 'ct-btn', disabled,
              onClick: () => onChange([...fallbacks, { provider: '', model: '' }]),
            }, t('addFallback')))
          : null)
    }

    function actionLabel(t, action) {
      switch (action) {
        case 'continued': return t('actContinued')
        case 'scheduled': return t('actScheduled')
        case 'stopped': return t('actStopped')
        case 'skipped': return t('actSkipped')
        case 'cancelled': return t('actCancelled')
        case 'retrying': return t('actRetrying')
        case 'failed': return t('actFailed')
        case 'scan': return t('actScan')
        default: return action
      }
    }

    function kindLabel(t, kind) {
      switch (kind) {
        case 'startup': return t('kindStartup')
        case 'transient': return t('kindTransient')
        case 'failover': return t('kindFailover')
        case 'scan': return t('kindScan')
        case 'manual': return t('kindManual')
        default: return t('kindEvent')
      }
    }

    function makePage(ctx, t) {
      return function Page() {
        const revision = useLocale(ctx)
        useStyle()
        const locale = ctx.locale.getSnapshot().active
        const [state, setState] = React.useState(null)
        const [draft, setDraft] = React.useState(null)
        const [models, setModels] = React.useState(null)
        const [error, setError] = React.useState('')
        const [notice, setNotice] = React.useState('')
        const [busy, setBusy] = React.useState('')
        const [dirty, setDirty] = React.useState(false)
        const alive = React.useRef(true)
        void revision

        React.useEffect(() => {
          alive.current = true
          return () => { alive.current = false }
        }, [])

        React.useEffect(() => {
          const controller = new AbortController()
          let first = true
          const load = async () => {
            try {
              const next = await api('state', undefined, controller.signal)
              if (!alive.current) return
              setState(next)
              if (first) {
                first = false
                setDraft(next.settings)
              }
            } catch (failure) {
              if (!controller.signal.aborted && alive.current) setError(t('loadFailed', { message: failure.message }))
            }
          }
          void load()
          const timer = setInterval(load, 5_000)
          return () => { clearInterval(timer); controller.abort() }
        }, [])

        React.useEffect(() => {
          const controller = new AbortController()
          api('models', undefined, controller.signal)
            .then(next => { if (alive.current) setModels(next) })
            .catch(() => { if (alive.current) setModels({ groups: [] }) })
          return () => controller.abort()
        }, [])

        React.useEffect(() => {
          if (!notice) return
          const timer = setTimeout(() => setNotice(''), 4_000)
          return () => clearTimeout(timer)
        }, [notice])

        if (state === null || draft === null) {
          return h('div', { className: 'ct-page' },
            h('p', { className: error ? 'ct-error' : 'ct-omit' }, error || '…'))
        }
        const edit = patch => { setError(''); setDirty(true); setDraft(current => ({ ...current, ...patch })) }
        const editSection = (name, patch) => {
          setError('')
          setDirty(true)
          setDraft(current => ({ ...current, [name]: { ...current[name], ...patch } }))
        }

        async function save() {
          if (busy) return
          setBusy('save'); setError(''); setNotice('')
          try {
            const next = await api('settings', { settings: draft })
            if (!alive.current) return
            setState(next); setDraft(next.settings); setDirty(false); setNotice(t('saved'))
          } catch (failure) {
            if (alive.current) setError(t('saveFailed', { message: failure.message }))
          } finally {
            if (alive.current) setBusy('')
          }
        }

        async function scan() {
          if (busy) return
          setBusy('scan'); setError(''); setNotice('')
          try {
            const result = await api('scan', {})
            if (!alive.current) return
            setState(result.status)
            if (result.result?.error) setError(t('scanFailed', { message: result.result.error }))
            else if (result.result?.skipped === 'busy') setNotice(t('scanBusy'))
            else setNotice(result.result?.scheduled > 0
              ? t('scanDone', { count: result.result.scheduled })
              : t('scanNone'))
          } catch (failure) {
            if (alive.current) setError(t('scanFailed', { message: failure.message }))
          } finally {
            if (alive.current) setBusy('')
          }
        }

        async function cancel(sessionId) {
          setError(''); setNotice('')
          try {
            const result = await api('cancel', { sessionId })
            if (!alive.current) return
            setState(result.status)
            setNotice(result.cancelled ? t('cancelDone') : t('cancelGone'))
          } catch (failure) {
            if (alive.current) setError(t('cancelFailed', { message: failure.message }))
          }
        }

        const pending = state.pending ?? []
        const recent = state.recent ?? []
        const catalogEmpty = (models?.groups?.length ?? 0) === 0

        return h('div', { className: 'ct-page' },
          h('header', { className: 'ct-head' },
            h('h2', null, t('title')),
            h('p', { className: 'ct-sub' }, t('subtitle'))),

          h(Section, null,
            h(Switch, {
              label: t('enabled'), hint: t('enabledHint'), checked: draft.enabled,
              onChange: value => edit({ enabled: value }),
            }),
            h('label', { className: 'ct-field' },
              h('span', null, t('recoveryMessage')),
              h('textarea', {
                value: draft.recoveryPrompt, maxLength: 2000, disabled: !draft.enabled,
                onChange: event => edit({ recoveryPrompt: event.target.value }),
              }),
              h('span', { className: 'ct-hint' }, t('recoveryMessageHint')))),

          h(Section, { title: t('startup'), hint: t('startupHint') },
            h(Switch, {
              label: t('startupEnabled'), checked: draft.startup.enabled,
              onChange: value => editSection('startup', { enabled: value }),
            }),
            h('div', { className: 'ct-grid' },
              h(NumberField, { label: t('grace'), value: draft.startup.graceSeconds, unit: t('seconds'), min: 0, max: 120, disabled: !draft.startup.enabled, onChange: value => editSection('startup', { graceSeconds: value }) }),
              h(NumberField, { label: t('lookback'), value: draft.startup.lookbackMinutes, unit: t('minutes'), min: 1, max: 10080, disabled: !draft.startup.enabled, onChange: value => editSection('startup', { lookbackMinutes: value }) }),
              h(NumberField, { label: t('maxSessions'), value: draft.startup.maxSessions, unit: t('sessions'), min: 1, max: 10, disabled: !draft.startup.enabled, onChange: value => editSection('startup', { maxSessions: value }) })),
            h('label', { className: 'ct-field' },
              h('span', null, t('prompt')),
              h('textarea', {
                value: draft.startup.continuePrompt, maxLength: 2000, disabled: !draft.startup.enabled,
                onChange: event => editSection('startup', { continuePrompt: event.target.value }),
              }),
              h('span', { className: 'ct-hint' }, t('promptHint')))),

          h(Section, { title: t('transient'), hint: t('transientHint') },
            h(Switch, {
              label: t('transientEnabled'), checked: draft.transient.enabled,
              onChange: value => editSection('transient', { enabled: value }),
            }),
            h('div', { className: 'ct-grid' },
              h(NumberField, { label: t('maxAttempts'), value: draft.transient.maxAttempts, unit: t('attempts'), min: 1, max: 20, disabled: !draft.transient.enabled, onChange: value => editSection('transient', { maxAttempts: value }) }),
              h(NumberField, { label: t('baseDelay'), value: draft.transient.baseDelaySeconds, unit: t('seconds'), min: 5, max: 3600, disabled: !draft.transient.enabled, onChange: value => editSection('transient', { baseDelaySeconds: value }) }),
              h(NumberField, { label: t('maxDelay'), value: draft.transient.maxDelaySeconds, unit: t('seconds'), min: 5, max: 86400, disabled: !draft.transient.enabled, onChange: value => editSection('transient', { maxDelaySeconds: value }) }),
              h(NumberField, { label: t('maxWait'), value: draft.transient.maxWaitMinutes, unit: t('minutes'), min: 1, max: 1440, disabled: !draft.transient.enabled, onChange: value => editSection('transient', { maxWaitMinutes: value }) }))),

          h(Section, { title: t('failover'), hint: t('failoverHint') },
            h(Switch, {
              label: t('failoverEnabled'), checked: draft.failover.enabled,
              onChange: value => editSection('failover', { enabled: value }),
            }),
            h(NumberField, { label: t('maxSwitches'), value: draft.failover.maxSwitches, unit: t('switches'), min: 0, max: 3, disabled: !draft.failover.enabled, onChange: value => editSection('failover', { maxSwitches: value }) }),
            h('span', { className: 'ct-label' }, t('fallbacks')),
            catalogEmpty ? h('p', { className: 'ct-hint' }, t('catalogUnavailable')) : null,
            h(FallbackRows, {
              t, models, fallbacks: draft.failover.fallbacks, disabled: !draft.failover.enabled,
              onChange: fallbacks => editSection('failover', { fallbacks }),
            })),

          h(Section, { title: t('status'), hint: t('statusHint') },
            h('div', { className: 'ct-actions' },
              h('button', { type: 'button', className: 'ct-btn', disabled: busy !== '', onClick: scan },
                busy === 'scan' ? t('scanRunning') : t('scan')),
              h('span', { className: 'ct-omit' },
                `${t('lastScan')}: ${state.lastScanAt ? timeText(state.lastScanAt, locale) : t('never')}${state.scanning ? ` · ${t('scanning')}` : ''}`)),
            h('h4', { style: { margin: 0, fontSize: '13px' } }, t('pending')),
            pending.length === 0
              ? h('p', { className: 'ct-omit' }, t('noPending'))
              : h('ul', { className: 'ct-list' }, pending.map(item => h('li', { className: 'ct-item', key: item.sessionId },
                h('div', { className: 'ct-item-head' },
                  h('span', { className: 'ct-badge' }, kindLabel(t, item.kind)),
                  h('span', { className: 'ct-label', title: item.sessionId }, item.title || item.sessionId.slice(0, 12)),
                  item.code ? h('span', { className: 'ct-omit' }, item.code) : null,
                  h('span', { className: 'ct-omit' }, `${t('attemptsLabel')} ${item.attempts}`)),
                h('div', { className: 'ct-item-head' },
                  h('span', { className: 'ct-omit' }, timeText(item.dueAt, locale)),
                  h('button', { type: 'button', className: 'ct-link', onClick: () => cancel(item.sessionId) }, t('cancel')))))) ,
            h('h4', { style: { margin: 0, fontSize: '13px' } }, t('recent')),
            recent.length === 0
              ? h('p', { className: 'ct-omit' }, t('noRecent'))
              : h('ul', { className: 'ct-list' }, recent.map((item, index) => h('li', { className: 'ct-item', key: `${item.at}-${index}` },
                h('div', { className: 'ct-item-head' },
                  h('span', { className: 'ct-badge' }, actionLabel(t, item.action)),
                  item.sessionId ? h('span', { className: 'ct-code' }, item.sessionId.slice(0, 12)) : null,
                  h('span', { className: 'ct-omit' }, timeText(item.at, locale))),
                item.detail ? h('span', { className: 'ct-hint' }, item.detail) : null)))),

          h('div', { className: 'ct-actions ct-footer' },
            h('button', { type: 'button', className: 'ct-btn ct-primary', disabled: busy !== '' || !dirty, onClick: save },
              busy === 'save' ? t('saving') : t('save')),
            h('button', { type: 'button', className: 'ct-btn', disabled: busy !== '' || !dirty, onClick: () => { setDraft(state.settings); setDirty(false); setError('') } }, t('reset')),
            dirty ? h('span', { className: 'ct-omit' }, t('dirty')) : null,
            error ? h('span', { className: 'ct-error', role: 'alert' }, error) : null,
            notice ? h('span', { className: 'ct-ok', role: 'status' }, notice) : null))
      }
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'continue-task: dictionaries')
      const t = ctx.locale.bind(NS)
      const Page = makePage(ctx, t)
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'continue-task',
        order: 72,
        label: () => t('nav'),
      }, Page))
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
