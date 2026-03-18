# 技術棧

> **更新日期：2026-03-18**
> Source of truth：`package.json`

## 前端框架

- **Next.js 15.3.2**：App Router（純前端，無 API routes — 後端在 Elixir）
- **React 19**
- **TypeScript 5 strict**（路徑別名：`@/` → `src/`）

## 樣式

- **Tailwind CSS 4**（PostCSS 整合）
- **CSS 自訂屬性（Design Tokens）**：定義於 `src/app/globals.css`，見 `docs/design-tokens.md`

## 測試

- **Vitest 4** + `@testing-library/react` + `happy-dom`（DOM 環境）
- 設定檔：`vitest.config.mjs`（單一設定，environment: "happy-dom"）
- 執行：`npm run test`

## 後端連線（Elixir）

- **REST API**：透過 `src/lib/api-client.ts`，見 `tasks/ticket-04a-auth-rest-client.md`
  - Guest 認證：`POST /auth/guest`
  - 房間 CRUD：`/rooms`、`/rooms/{id}/join`、`/rooms/{id}/leave`
- **Phoenix Channel（WebSocket）**：透過 `src/lib/channel-client.ts`，見 `tasks/ticket-04b-channel-client.md`
  - Channel：`werewolf:room:{id}`、`werewolf:room:mock`
  - 使用 `phoenix` npm 套件（v1.8+）

## 圖示

- **lucide-react**（v0.577+）

## 程式碼品質

- **ESLint 9**（eslint-config-next）
- **husky + lint-staged**：pre-commit hook 執行 ESLint
- 執行 lint：`npm run lint`

## Git 工作流

- 主分支：`main`
- 開發分支：`release/v0.1.0`
- 功能分支：`codex/<ticket-id>`（worktree 在 `.worktree/`）
- 詳見：`docs/worktrees.md`

## AI 工具

- **prpm + superpowers**：skill 管理（`prpm.lock` 記錄安裝）
- **Skills**：`.ai/skills/`（`.openskills` 是 symlink）
- **規則**：`.ai/rules/`（`.cursor/rules` 是 symlink）
