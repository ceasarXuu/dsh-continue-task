# dsh-continue-task 本地安装与验证

已验证：2026-11-20，DSH Desktop 0.2.2-rc.5，profile `desktop`。

## 修改后先跑什么

```sh
cd /Volumes/inwolf-4T/projects/dsh-mods/dsh-continue-task
node --test tests/*.test.js
for f in index.js client.js host/*.js; do node --check "$f"; done
```

纯 JavaScript，不需要构建或打包；profile 中以 `link:` 方式安装时，修改文件会由 HMR 重新载入 Host 半边。

## 安装

在对话中通过 `plugin_manager`（或 DSH 的 **Plugins → Add plugin**）安装目录：

```text
/Volumes/inwolf-4T/projects/dsh-mods/dsh-continue-task
```

安装结果中应看到：

```text
application: applied
bundle: @ceasarxuu/dsh-continue-task
```

## 确认 Host 半边活着

插件状态文件应被创建并带最近一次启动扫描时间：

```sh
node -e "const s=require(process.env.HOME+'/.dsh/profiles/desktop/continue-task/state.json'); console.log(new Date(s.lastScanAt).toISOString(), s.settings)"
```

同时检查插件行：

```text
plugin_manager list_plugins offset≈216
→ include:continue-task, moduleName=@ceasarxuu/dsh-continue-task, enabled=true, fiberPhase=active
```

## Host 代码改动后强制重载

HMR 未必会重载已 link 的包；最可靠的方式是关闭再启用该行：

```text
plugin_manager set_plugin target=include:continue-task enabled=false
plugin_manager set_plugin target=include:continue-task enabled=true
```

重载后 `lastScanAt` 会更新，`state.json` 的 settings 会出现新增字段。若没有更新，说明插件没有重新 `apply`。

## 客户端页面

客户端半边注册 `settings.section`（id `continue-task`），入口是 **Settings → 任务续传**。修改 `client.js` 后通常需要刷新页面；当前没有 `pnpm run dev:web` 时客户端插件不会自动热更新。

浏览器控制不可用时，只验证到：`client.js` 通过模块工厂测试、包声明包含 `dsh.client` 与 `./client` 导出、插件行 active。页面实际渲染与视觉需要在已连接的页面里刷新确认。

## 故障排查

- `state.json` 不存在：插件未激活，先查插件行 fiberPhase。
- `lastScanAt` 一直为 0：`sessionController.list` 或启动扫描失败，看宿主日志中的 `continue-task: scan failed`。
- 没有自动恢复：确认总开关、对应策略开关、回看窗口；额度切换还需要至少一个备用模型。
- 会话被自动恢复后又重复恢复：检查 `recent` 中是否有 `stopped`/`retrying`，以及日志尾部是否已有 `continue-task-` 来源的待处理消息（扫描会跳过已排队输入的会话）。
