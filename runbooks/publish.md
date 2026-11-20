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

## 从 WhaleCode 复制的发布方式

`ceasarXuu/WhaleCode/.github/workflows/npm-publish.yml` 使用的是 **npm Trusted Publishing（OIDC）**，仓库里没有 `NPM_TOKEN` secret。本仓库的 `publish.yml` 已经复制了同样的模式：

- `permissions: id-token: write`
- `actions/setup-node` 配置 `registry-url: https://registry.npmjs.org`
- 没有 token 时由 npm 用 OIDC 发放短时凭据
- 有 `NPM_TOKEN`/`NODE_AUTH_TOKEN` secret 时才额外写入 token

**但 trusted publishing 只能为已经存在的包配置**。`@ceasarxuu/dsh-continue-task` 还没有发布过，所以 npm 无法在首次发布前给它建立信任关系；首次 `0.1.0` 必须先有一次带 token 的发布（或本地发布一次）。发布成功后，再配置 trusted publisher，后续版本就可以完全走 OIDC。

## npm 凭据

首次发布时二选一：

### A. 仓库 Secret（首次发布用）

在 <https://github.com/ceasarXuu/dsh-continue-task/settings/secrets/actions/new> 添加：

- Name: `NPM_TOKEN`（也支持 `NODE_AUTH_TOKEN`）
- Value: 有 `@ceasarxuu` 发布权限的 npm granular access token 或 automation token

token 需要 `read` + `publish` 权限；如果账号开启了 2FA，使用 automation/granular token，不要用需要交互 OTP 的 classic token。

### B. 首次发布后：npm Trusted Publishing（长期方案）

`0.1.0` 在 npm 上存在后，在 npmjs.com 的包设置里配置 Trusted Publisher，或用已登录的 npm CLI：

```sh
npm login
npm trust github @ceasarxuu/dsh-continue-task \
  --file publish.yml \
  --repo ceasarXuu/dsh-continue-task \
  --allow-publish -y
```

- Provider: GitHub Actions
- Repository: `ceasarXuu/dsh-continue-task`
- Workflow: `publish.yml`

配置成功后可以删除 `NPM_TOKEN` secret；workflow 会用 `id-token: write` 走 OIDC，和 WhaleCode 一样不再保存长期 token。

## 当前状态

2026-11-20 首次 `workflow_dispatch` 失败于 `npm error code ENEEDAUTH`：新仓库没有 `NPM_TOKEN`/`NODE_AUTH_TOKEN` secret，npm 侧也未配置该包的 trusted publisher。检查过 `ceasarXuu` 下所有仓库的 secret 名称，没有可复制的 npm token（WhaleCode 用的是 OIDC，不存在 token 值；GitHub secret 也不能通过 API 读取值）。补上首次发布凭据后重跑：

```sh
gh workflow run publish.yml --ref main
gh run watch
```

发布成功后验证：

```sh
npm view @ceasarxuu/dsh-continue-task version
```
