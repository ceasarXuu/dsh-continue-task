# 任务续传（dsh-continue-task）

为 DeepSeek Harness 提供**异常中断后的自动恢复**。它只做一件事：在会话因应用退出、网络故障或模型额度问题停下来后，按你配置的策略把任务继续下去。

所有恢复都通过普通的会话消息完成，因此对话里能看到“为什么继续、继续了什么”，会话日志仍然是唯一事实来源。

[![Listed on dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/zh/plugins/ceasarxuu/dsh-continue-task)

## 恢复策略

| 中断情形 | 判定依据 | 默认动作 |
| --- | --- | --- |
| 应用崩溃 / 强制退出 | 持久化日志最后一条 `turn/end` 是 `interrupted`（由 DSH 冷读补齐），且该轮有用户输入和已进入的步骤 | 启动后追加“应用重启”续传消息，开始新一轮 |
| 应用正常退出但停在步骤边界 | 最后一条 `turn/end` 为 `aborted` + `disposed`，且最后一步已 `step/end` | 跳过；视为用户主动结束 |
| 应用正常退出时仍有执行中的步骤 | `aborted` + `disposed`，且最后一步尚未 `step/end` | 启动后追加“应用退出”续传消息 |
| 网络 / 超时 / 服务端 / 限流 | 最后一条 `turn/end.error.code` 属于可重试集合 | 指数退避重试；网络恢复后的下一次重试会成功 |
| 额度耗尽、凭据失效、模型不可用 | `QUOTA`、`ACCOUNT_QUOTA`、`AUTH` 等路由类错误 | 切换到配置的备用模型，再追加续传消息 |
| 用户主动停止 | `aborted` + `user` | 永不自动继续 |
| 子会话 | `origin === 'subagent'` | 跳过；由父会话负责 |
| 已归档会话 | `workspaceRegistry.archivedSessionIds` | 跳过 |
| 正常完成 / 阻塞 / 达到 token 上限 | 其他 `turn/end` 原因 | 跳过 |

默认只在启动后回看最近 **30 分钟**内有活动的会话，每次最多恢复 **2 个**，避免首次安装时把很久以前的旧任务全部唤醒。可在设置页调整。

## 安装

### 插件市场

在 DSH 的 **Plugins → Add plugin** 输入包名：

```text
@ceasarxuu/dsh-continue-task
```

也可以在 [dsh-plugin.org 的收录页](https://dsh-plugin.org/zh/plugins/ceasarxuu/dsh-continue-task) 查看介绍，或在安装了 DSH Plugin Hub 后搜索“任务续传 / dsh-continue-task”。

### 命令行

```sh
dsh plugin --profile <profile> add @ceasarxuu/dsh-continue-task
```

`<profile>` 换成实际 profile 名：浏览器版通常是 `web`，桌面版通常是 `desktop`；可用 `ls ~/.dsh/profiles/` 查看。

### 本地开发

在 **Plugins → Add plugin** 选择本目录（或指向本目录的链接）。

安装完成后确认插件行已启用。仓库地址：<https://github.com/ceasarXuu/dsh-continue-task>。

## 在 DSH「发现」中订阅

DSH 不内置第三方插件索引。打开 **Plugins → 实验性插件 → 自定义插件索引**，添加本插件的索引源：

```text
https://raw.githubusercontent.com/ceasarXuu/dsh-continue-task/main/market/index.json
```

jsDelivr 备用（缓存可能滞后）：

```text
https://cdn.jsdelivr.net/gh/ceasarXuu/dsh-continue-task@main/market/index.json
```

添加后在 **发现 / Discover** 里搜索“任务续传”或“Continue Task”即可安装。索引使用 DSH 官方 format 1，已通过 `@deepseek-ai/dsh-plugin-market-index` 校验。

## 使用

1. 在 **Plugins** 中安装并启用本插件。
2. 打开 **Settings → 任务续传**；设置修改后自动保存，不需要手动点保存。
3. 按需配置：
   - **启动后继续**：启动等待、回看时间、每次最多恢复数、续传提示语。
   - **网络中断自动重试**：最多重试次数、首次等待、单次最长等待、总等待上限。
   - **额度不足切换模型**：最多切换次数，以及最多 3 个备用 `provider/model`（可带推理强度）。
   - **通用恢复提示语**：非重启类恢复追加到对话中的消息。
4. 每个开关右侧有“恢复默认设置”链接：恢复该节策略的默认值；总开关处为“恢复全部默认设置”。为避免误删，备用模型列表在恢复时保留。
5. 页面下方能看到待恢复会话、最近动作，并可“立即扫描并恢复”或取消某一个待恢复项。手动扫描会重置匹配会话的自动重试计数，用于在修好网络或额度后强制再试一次。

恢复请求被接受后，会话会在侧边栏显示为运行中；你可以像普通会话一样查看、停止或继续输入。手动停止会自动取消该会话的自动重试。

## 设置存储

插件设置和重试计数存放在：

```text
$DSH_PROFILE_DIR/continue-task/state.json
```

通常为 `~/.dsh/profiles/<profile>/continue-task/state.json`。文件权限 `0600`，只保存策略、会话 ID、计数和最近动作，不保存对话内容。删除该文件会恢复默认设置。

## 安全边界

- 所有自动恢复都受总开关、分类开关、次数上限和总等待时间约束。
- 网络重试只针对可重试错误；额度/凭据类错误不会无限重试，备用模型耗尽后停止。
- 子会话、归档会话、用户主动停止的会话不会被自动恢复。
- 手动输入会取消该会话正在等待的自动恢复，并清零本轮的自动恢复计数。
- 切换模型只记录在该会话的 `model/selection` 上，不会修改全局默认模型；恢复后可以在输入框的模型选择器里切回原模型。

## 已知限制

- “启动后继续”依赖持久化日志的最后一个回合状态；如果崩溃发生在尚未落盘的用户输入之前，可能看不到可恢复的回合。
- 网络恢复检测采用退避重试，不主动探测系统网络状态；离线期间的重试会快速失败并继续退避。
- 不在 DSH 原生可续传集合内的错误（例如模型返回格式异常）会追加一条续传消息来恢复，而不是使用原生的空重试。
- 过期会话的文件修改时间来自持久化后端；没有本地文件位置的远程存储只能回退到会话列表的最近提示时间。

## 推广片

30 秒横版（1920×1080，无旁白，亮色发布风格）：

[观看 / 下载 MP4](https://github.com/ceasarXuu/dsh-continue-task/releases/download/v0.1.0/dsh-continue-task-promo.mp4)

Remotion 源码、时间线和配乐生成脚本见 [`promo/`](promo/)。

## 开发

```sh
node --test tests/*.test.js
```

本地开发：在 DSH 内打开 **Plugins → Add plugin**，选择本目录；安装完成后确认插件行已启用。发布包：`@ceasarxuu/dsh-continue-task`。
