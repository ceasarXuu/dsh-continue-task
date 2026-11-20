# 发布到 GitHub 与 npm

- 仓库：<https://github.com/ceasarXuu/dsh-continue-task>
- npm：<https://www.npmjs.com/package/@ceasarxuu/dsh-continue-task>

## 当前状态（2026-11-20）

- `0.1.0` 已发布到 npm，`npm view @ceasarxuu/dsh-continue-task version` 返回 `0.1.0`
- `npm install @ceasarxuu/dsh-continue-task@0.1.0` 已在临时目录验证
- npm **Trusted Publishing** 已配置：
  - provider: GitHub Actions
  - repository: `ceasarXuu/dsh-continue-task`
  - workflow: `publish.yml`
  - permissions: publish、stage publish
  - trust id: `4cd65c3b-1d72-459c-883a-95d24bf42a4f`
- 仓库没有 `NPM_TOKEN` secret；后续发布由 `publish.yml` 使用 `id-token: write` 走 OIDC
- GitHub Release：<https://github.com/ceasarXuu/dsh-continue-task/releases/tag/v0.1.0>
- Release 触发的 workflow run `44701770837` 已通过；因为 `0.1.0` 已存在，Publish 步骤按设计跳过

## 发布新版本

1. 修改 `package.json` 的 `version`，跑 `node --test tests/*.test.js`。
2. 提交并推送 `main`。
3. 打 tag 并推送：

   ```sh
   git tag -a vX.Y.Z -m "dsh-continue-task X.Y.Z"
   git push origin vX.Y.Z
   ```

4. 创建并发布 GitHub Release。发布事件触发 `.github/workflows/publish.yml`：

   ```sh
   gh release create vX.Y.Z --title "vX.Y.Z" --notes-file notes.md
   gh run watch
   ```

workflow 会跑测试、校验 release tag 与 `package.json` 版本一致、检查该版本是否已存在，然后执行：

```sh
npm publish --access public --registry=https://registry.npmjs.org/
```

已存在的版本会跳过 publish；发布后的 provenance 由 npm trusted publishing 自动生成。

## 首次发布新包的引导（本次已做过）

npm trusted publishing 只能给**已存在**的包配置。新包的首次发布必须先有一次带凭据的发布；本次通过本地浏览器 2FA 完成：

```sh
npm login --auth-type=web
npm publish --access public --registry=https://registry.npmjs.org/
npm trust github @ceasarxuu/dsh-continue-task \
  --file publish.yml \
  --repo ceasarXuu/dsh-continue-task \
  --allow-publish -y
```

如果后续再建新包，也可以给仓库添加 `NPM_TOKEN`/`NODE_AUTH_TOKEN` secret 让 workflow 完成首次发布，package 在 npm 上存在后再配置 trusted publishing 并删除 token。GitHub secret 只能写、不能通过 API 读回；不要尝试从其他仓库复制 secret 值。

## 分发与发现

- **dsh-plugin.org（社区插件市场）**：自动扫描公开仓库、`dsh-plugin` topic 和根目录 `package.json`，当前条目已标记“已验证”：<https://dsh-plugin.org/zh/plugins/ceasarxuu/dsh-continue-task>。无需手工提交；README 变更后下一轮刷新会同步。
- **DSH 官方「发现」**：官方不内置第三方索引，但支持 format 1 的索引源。本仓库的索引在 [`market/index.json`](../market/index.json)，订阅地址：
  - `https://cdn.jsdelivr.net/gh/ceasarXuu/dsh-continue-task@main/market/index.json`
  - 备用：`https://raw.githubusercontent.com/ceasarXuu/dsh-continue-task/main/market/index.json`
- 每次发新版本后，记得把 `market/index.json` 的 `versions` 加上新版本并把 `publishTimestamp` 改成该版本的 npm 发布时间；然后用 `@deepseek-ai/dsh-plugin-market-index` 的 `parseMarketIndex` 校验。
- awesome-dsh-plugin-pro 的“作者自荐”要求仓库 Star 数 > 10；当前未达到，暂不提交，等社区增长后再走该渠道。

## 验证

```sh
npm view @ceasarxuu/dsh-continue-task version
npm view @ceasarxuu/dsh-continue-task dist-tags --json
tmp=$(mktemp -d)
cd "$tmp" && npm init -y >/dev/null && npm install @ceasarxuu/dsh-continue-task@0.1.0 --ignore-scripts
```
