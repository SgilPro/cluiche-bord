# 架構規範

> 此為純前端 Next.js 15 App Router 專案。後端（REST + WebSocket）由 Elixir 處理。

## 專案結構

```
src/
├── app/                    # Next.js App Router 路由
│   ├── page.tsx           # 首頁
│   ├── create-room/       # 建立房間
│   ├── rooms/[roomId]/    # 等待室
│   └── game/[roomId]/     # 遊戲頁面
├── components/
│   ├── ui/                # 基礎 UI 元件（Button、Card、FormField 等）
│   └── pages/             # 遊戲階段元件（NightWolvesPage 等）
└── lib/
    ├── api-client.ts      # REST API 客戶端（Elixir 後端）
    ├── channel-client.ts  # Phoenix Channel 客戶端（WebSocket）
    └── games/werewolf/    # 狼人殺遊戲型別定義
```

## 元件層級

1. **路由頁面**（`src/app/`）：資料獲取、頁面結構、Next.js 路由
2. **遊戲階段元件**（`src/components/pages/`）：各遊戲階段 UI，透過 `PhaseRouter` 切換
3. **UI 元件**（`src/components/ui/`）：無業務邏輯的基礎元件

## UI 元件設計原則

- 使用 Design Tokens（CSS 自訂屬性），不寫 hardcoded 顏色值
- Mobile-first（`max-w-[430px]` 限制寬度，桌面置中）
- Skeuomorphic 票券風格：`Card variant="ticket"` 使用虛線邊框
- 底部固定欄：`FixedBottomBar`（mode="equal" 或 "raw"）

## 後端整合

- 所有 API 呼叫透過 `src/lib/api-client.ts`
- Token 儲存於 localStorage（guest token）
- WebSocket 透過 `src/lib/channel-client.ts`，連接 Phoenix Channel

## 狀態管理

- **本地狀態**：React `useState` / `useReducer`
- **WebSocket 狀態**：由 Channel client 接收，透過 props/callback 傳遞
- 目前無全域狀態管理（Zustand/Redux），未來可考慮

## 測試規範

- 元件測試：`@testing-library/react`，render 驗證 DOM 結構
- 業務邏輯測試：純函式單元測試
- 每個 `.tsx`/`.ts` 都應有對應的 `.test.tsx`/`.test.ts`
- 測試環境：`happy-dom`（DOM API 支援）

## Git 工作流

- 功能開發在 worktree（`.worktree/<ticket>`），分支 `codex/<ticket>`
- Merge 到 `release/v0.1.0`，再 PR 到 `main`
- 詳見 `docs/worktrees.md`
