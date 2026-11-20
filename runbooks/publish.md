# 发布到 GitHub 与 npm

当前仓库：<https://github.com/ceasarXuu/dsh-continue-task>
npm 包名：`@ceasarxuu/dsh-continue-task`

## GitHub

```sh
git push origin main
git push origin v0.1.0
```

发布用的 workflow 是 `.github/workflows/publish.yml`，触发方式：

- 发布 GitHub Release（`release: published`）
- 手动 `workflow_dispatch`

workflow 会先跑 `node --test tests/*.test.js`，校验 release tag 与 `package.json` 版本一致，再执行 `npm publish --access public --provenance`。已发布的版本会跳过 publish。

## npm 凭据

workflow 支持两种方式，任选其一：

### A. 仓库 Secret（最简单）

在 <https://github.com/ceasarXuu/dsh-continue-task/settings/secrets/actions/new> 添加：

- Name: `NPM_TOKEN`（也支持 `NODE_AUTH_TOKEN`）
- Value: 有 `@ceasarxuu` 发布权限的 npm granular access token 或 automation token

token 需要 `read` + `publish` 权限；如果账号开启了 2FA，使用 automation/granular token，不要用需要交互 OTP 的 classic token。

### B. npm Trusted Publishing（OIDC）

在 npmjs.com 的包设置里配置 Trusted Publisher：

- Provider: GitHub Actions
- Repository: `ceasarXuu/dsh-continue-task`
- Workflow: `publish.yml`

配置后 workflow 不需要 token，使用 `id-token: write` 走 OIDC。注意：首次发布通常仍需要一次 token 发布，之后才能启用 trusted publishing。

## 当前状态

2026-11-20 首次 `workflow_dispatch` 失败于 `npm error code ENEEDAUTH`：新仓库没有 `NPM_TOKEN`/`NODE_AUTH_TOKEN` secret，npm 侧也未配置该包的 trusted publisher。补上上面任一凭据后重跑：

```sh
gh workflow run publish.yml --ref main
gh run watch
```

发布成功后验证：

```sh
npm view @ceasarxuu/dsh-continue-task version
```
