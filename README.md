# 每日饮食与花销

纯前端 PWA（React + Vite）：按日记录饮食与餐费，可选调用 OpenAI 兼容接口估算营养与热量，并给出 **0–100 分 + 分级（S/A/B/C/D）** 与建议。数据保存在浏览器 `localStorage`。

代码位于本仓库的 [`frontend/`](./frontend/) 目录。

## 功能概要

- 按日记录餐/食物描述、可选时间与费用（花销）
- LLM 分析热量与宏量营养、短板与可执行建议
- 设置页可配置 API、评分阈值（score→grade）、导入/导出 JSON

## 本地开发

```bash
cd frontend
npm install
npm run dev
```

开发端口见 [`frontend/vite.config.js`](./frontend/vite.config.js)（当前为 `5174`）。使用 **Hash 路由**，适合 GitHub Pages 子路径部署。

## 仓库名与 `base`（GitHub Pages）

生产构建在设置环境变量 `BUILD_PAGES=1` 时使用 `base: '/daily-diet-app/'`，见 [`frontend/vite.config.js`](./frontend/vite.config.js)。

- **若 GitHub 仓库名为 `daily-diet-app`**：Project Pages 为 `https://<用户名>.github.io/daily-diet-app/`，与当前 `base` **一致**。
- **若仓库名不同**：请把 `base` 改为 `/<你的仓库名>/`（或实际子路径）后重新执行 `build:pages`，否则易出现白屏或静态资源 404。

## 方式一：GitHub Actions 部署（推荐）

在 GitHub **Settings → Pages** 中将 **Source** 选为 **GitHub Actions**。

在本仓库根目录添加 `.github/workflows/deploy-pages.yml`（单仓库、根下仅有 `frontend/` 时的示例）：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build
        run: |
          cd frontend
          npm ci
          BUILD_PAGES=1 npx vite build --outDir ../docs

      - uses: actions/upload-pages-artifact@v4
        with:
          path: docs

      - id: deploy
        uses: actions/deploy-pages@v4
```

## 方式二：本地构建后提交 `docs/`（备用）

**Windows**（`frontend/package.json` 已提供脚本）：

```bash
cd frontend
npm install
npm run build:pages
```

产物在仓库根目录的 `docs/`。将 `docs` 提交后，在 **Settings → Pages** 选择 **Deploy from a branch**，Branch 选默认分支，Folder 选 **`/docs`**。

**macOS / Linux**：

```bash
cd frontend
npm install
BUILD_PAGES=1 npx vite build --outDir ../docs
```

## LLM 与跨域

分析在浏览器内请求你配置的接口。若服务商不允许浏览器跨域（CORS），需更换网关或自建反向代理（本应用未内置代理）。

## PWA

请从 **实际 Pages 地址**（含 `/daily-diet-app/` 路径）再「添加到主屏幕」，避免快捷方式指向错误路径。

## Monorepo 说明

若本应用放在更大仓库的子目录（例如 `agent_lab/daily-diet-app/`），请将工作流里的 `cd`、`cache-dependency-path`、`upload-pages-artifact` 的 `path` 等改为带子目录前缀（例如 `daily-diet-app/frontend`、`daily-diet-app/docs`）。
