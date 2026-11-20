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

## 验证

```sh
npm view @ceasarxuu/dsh-continue-task version
npm view @ceasarxuu/dsh-continue-task dist-tags --json
tmp=$(mktemp -d)
cd "$tmp" && npm init -y >/dev/null && npm install @ceasarxuu/dsh-continue-task@0.1.0 --ignore-scripts
```
