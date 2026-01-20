# 桌上遊戲網站（cluiche-bord）

## 架構說明

本專案採用現代化分層架構，將即時通訊與靜態/RESTful 服務分離，確保效能與維護性：

### 1. 前端（Next.js）與 RESTful API
- **部署平台**：Vercel
- **內容**：
  - Next.js 前端頁面（靜態資源）
  - RESTful API（如 `/api/rooms`，房間管理、排行榜等）
- **優點**：
  - Vercel 會自動最佳化靜態資源、CDN 快取
  - RESTful API 適合短連線、無狀態請求

### 2. 即時通訊伺服器（Socket.IO）
- **部署平台**：獨立 Node.js 主機（如 AWS EC2、Render、Railway、Fly.io 等）
- **內容**：
  - `socket-server.js`，專門處理遊戲房間、聊天室、語音等即時互動
  - 連線端點如：`ws://your-socket-server.com:4001`
- **注意事項**：
  - 必須設置 CORS 允許前端網域連線
  - 伺服器需長時間運作，不能用 serverless

### 3. 前端與 Socket.IO 連線方式
- 前端所有即時互動（聊天室、語音、房間同步）都透過 `src/lib/socket.ts` 統一管理 socket 連線：
  ```typescript
  import { getSocket } from "@/lib/socket";
  const socket = getSocket();
  ```
- 連線設定：
  ```typescript
  socket = io("ws://your-socket-server.com:4001", {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    // ... 其他設定
  });
  ```

### 4. 房間與人數同步
- 遊戲房間列表、聊天室人數等，皆由 Socket.IO 伺服器即時同步，RESTful API 提供房間基本資料。

---

## 部署建議

- **前端/RESTful API**：直接部署到 Vercel。
- **Socket.IO 伺服器**：部署到你能控制的 Node.js 主機，開放 4001 port，設好 CORS。
- **前端連線設定**：記得將 socket 伺服器網址設為公開可連線的網址。

---

## 目錄結構簡述

- `src/app/`：Next.js 前端與 API Route
- `src/lib/socket.ts`：全站唯一 socket 連線管理
- `socket-server.js`：獨立即時通訊伺服器
- `data/rooms.json`：房間資料儲存（開發用）

---

如需更多部署細節或架構優化建議，請參考專案內文件或聯絡開發者。
