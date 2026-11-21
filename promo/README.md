# 任务续传 · 30 秒推广片（Remotion）

横版 1920×1080 / 30fps，时长 30 秒，无旁白，亮色发布风格。

## 时间线

| 时间 | 场景 |
|---|---|
| 0–3s | 会话跑到一半，应用中断 |
| 3–7s | 崩溃 / 断网 / 额度耗尽三张问题卡 |
| 7–10s | 重开会话、翻记录、重新解释：太慢了 |
| 10–14s | 产品 reveal：任务续传 |
| 14–20s | 启动续传 / 网络重试 / 额度切换 |
| 20–23s | 设置页：策略可调、自动保存、恢复默认 |
| 23–26s | 真实运行日志：扫描 250、恢复 2 个 |
| 26–30s | 双 CTA、作者头像、求 GitHub Star |

## 开发与渲染

```sh
npm install
npm run dev       # Remotion Studio 预览
npm run render    # 输出 out/dsh-continue-task-promo.mp4
```

渲染需要 Remotion 的 Chrome Headless Shell（首次自动下载）。

## 素材

- `public/avatar.png`：GitHub 头像（ceasarXuu）
- `public/icon.svg`：插件图标
- `public/audio/music.mp3`：为本片生成的 30 秒配乐
- `audio/generate_music.py`：配乐生成脚本（numpy；120 BPM，C 大调，30 秒）

重新生成配乐：

```sh
python3 audio/generate_music.py
ffmpeg -y -i public/audio/music.wav -codec:a libmp3lame -b:a 192k public/audio/music.mp3
```

配乐是程序合成的原创音轨，不依赖第三方曲库；如要替换，直接覆盖 `public/audio/music.mp3` 即可。

## 结构

```text
src/
  Root.tsx        Composition
  Promo.tsx       30 秒时间线
  components/     背景、图标、场景容器
  scenes/         8 个场景
public/           头像、图标、配乐
audio/            配乐生成脚本
```

## 本机渲染备注

本机 Chrome Headless Shell 启动较慢时，Remotion 默认 25 秒的浏览器连接超时会导致渲染失败。可临时把 `node_modules/@remotion/renderer/dist/open-browser.js` 中的 `timeout: 25000` 调成 `timeout: 120000`（本机已验证）；这是本机环境 workaround，不属于工程源码。
