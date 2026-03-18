# 桌上遊戲網站（cluiche-bord）

## 架構說明

本專案為純前端 Next.js 15 App Router 應用程式。後端（REST API + WebSocket）由 Elixir 處理，前端不包含 API routes。

### 1. 前端（Next.js）

- **框架**：Next.js 15 App Router
- **部署平台**：Vercel
- **內容**：
  - Next.js 前端頁面（靜態資源）
  - 無 API routes — 所有後端邏輯由 Elixir 伺服器處理
- **優點**：
  - Vercel 會自動最佳化靜態資源、CDN 快取
  - 前後端分離，各自獨立部署與擴展

### 2. 後端（Elixir）

- **框架**：Phoenix（REST + Channel WebSocket）
- **部署平台**：獨立主機（如 Fly.io、Render 等）
- **REST API**：房間管理、Guest 認證等無狀態請求
- **Phoenix Channel**：即時遊戲狀態同步（`werewolf:room:{id}`）

### 3. 前端與後端連線方式

前端透過兩個客戶端模組與 Elixir 後端溝通：

**REST API（`src/lib/api-client.ts`）：**
```typescript
import { createGuestSession, createRoom, joinRoom } from "@/lib/api-client";
```

**Phoenix Channel WebSocket（`src/lib/channel-client.ts`）：**
```typescript
import { joinChannel, pushEvent } from "@/lib/channel-client";
```

### 4. 遊戲狀態同步

- 遊戲房間列表、玩家狀態等，皆由 Phoenix Channel 即時同步
- REST API 提供房間建立、加入等操作

---

## 快速開始

1. **安裝相依套件**：
   ```bash
   npm install
   ```

2. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```
   訪問：`http://localhost:3000`

3. **執行測試**：
   ```bash
   npm run test
   ```

4. **Lint 檢查**：
   ```bash
   npm run lint
   ```

---

## 目錄結構簡述

- `src/app/`：Next.js App Router 路由頁面
- `src/components/ui/`：基礎 UI 元件（Button、Card、FormField 等）
- `src/components/pages/`：遊戲階段元件（NightWolvesPage 等）
- `src/lib/api-client.ts`：REST API 客戶端（Elixir 後端）
- `src/lib/channel-client.ts`：Phoenix Channel 客戶端（WebSocket）
- `src/lib/games/werewolf/`：狼人殺遊戲型別定義

---

## 本地網路開發（WLAN 連線）

如果想在同一 WLAN 網路中的多個設備（手機、平板等）測試：

### 快速設定

1. **找出你的區域網路 IP**：
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **設定環境變數**：
   在 `.env.local` 中加入後端 API 網址：
   ```env
   NEXT_PUBLIC_API_URL=http://YOUR_LOCAL_IP:4000
   NEXT_PUBLIC_SOCKET_URL=ws://YOUR_LOCAL_IP:4000
   ```

3. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```

4. **從其他設備連線**：
   在同一 WLAN 的設備上訪問：`http://YOUR_LOCAL_IP:3000`

---

## Git 工作流

- 主分支：`main`
- 開發分支：`release/v0.1.0`
- 功能分支：`codex/<ticket-id>`（worktree 在 `.worktree/`）
- 詳見：`docs/worktrees.md`

---

如需更多部署細節或架構優化建議，請參考 `docs/` 目錄下的文件。
