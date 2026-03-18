# 專案當前狀態

## 已完成功能

### 基礎架構
- ✅ Next.js 15 專案初始化
- ✅ TypeScript 設定
- ✅ Prisma 資料庫設定
- ✅ Socket.IO 基礎架構
- ✅ 基本專案結構

### 資料庫
- ✅ Prisma schema 定義
- ✅ 初始 migration 完成
- ✅ 基本資料模型（User, Room, Game）

### 前端
- ✅ 基本頁面結構
- ✅ 遊戲房間頁面（`/game/[roomId]`）
- ✅ 房間列表頁面（`/rooms`）
- ✅ Socket.IO 客戶端連線管理

### 後端
- ✅ 房間 API（`/api/rooms`）
- ✅ Socket.IO 伺服器（`socket-server.js`）

## 進行中功能

### 遊戲房間系統
- 🔄 房間建立和加入功能
- 🔄 即時狀態同步
- 🔄 玩家管理

## 待實作功能

### Phase 0: 基礎設施設定
- ⏳ Supabase PostgreSQL 設定
- ⏳ Prisma 連線與 migration 驗證
- ⏳ 環境變數設定

### Phase 1: 房間持久化
- ⏳ 從檔案系統遷移到 Prisma
- ⏳ 房間資料庫操作層
- ⏳ Socket.IO 伺服器更新
- ⏳ 自動清理機制重構

### Phase 2: 狼人殺遊戲
- ⏳ 遊戲資料模型設計
- ⏳ 狼人殺核心邏輯實作
- ⏳ Socket.IO 遊戲事件
- ⏳ 前端遊戲 UI
- ⏳ 遊戲狀態持久化

### 未來規劃
- ⏳ 實作 1-2 款其他遊戲
- ⏳ 遊戲核心抽象層重構
- ⏳ 遊戲創建器支援

## 已知問題

### 技術債務
- Socket.IO 伺服器需要獨立部署
- 缺少完整的錯誤處理
- 缺少輸入驗證

### 待優化
- API 回應格式統一
- 錯誤訊息國際化
- 效能優化

## 近期目標

### Phase 0（優先）
1. **設定 Supabase PostgreSQL**：完成資料庫基礎設施設定

### Phase 1（核心）
2. **房間持久化重構**：從檔案系統遷移到 Prisma，保持現有功能不變

### Phase 2（遊戲功能）
3. **狼人殺遊戲實作**：實作完整的狼人殺遊戲邏輯和 UI

## 開發策略
- **玩家身份**：現階段採用「無登入 + 暱稱制」，未來再考慮正式認證系統
- **資料庫**：使用 Supabase PostgreSQL，連線字串可抽換
- **遊戲架構**：先實作狼人殺，未來實作更多遊戲後再抽象化

## 開發環境

### 本地開發
- 前端：`npm run dev`（通常運行在 http://localhost:3000）
- Socket.IO：`node socket-server.js`（通常運行在 http://localhost:4001）
- 資料庫：PostgreSQL（本地或 Supabase）

### 環境變數
需要設定的環境變數（參考 `.env.example`）：
- `DATABASE_URL`：PostgreSQL 連線字串
- `NEXTAUTH_SECRET`：NextAuth.js 密鑰（未來）
- `SOCKET_SERVER_URL`：Socket.IO 伺服器 URL
