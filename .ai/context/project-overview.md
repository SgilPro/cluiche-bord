# 專案概覽

## 專案名稱
Cluiche Bord（桌遊平台）

## 專案目標
建立一個類似 BoardGameArena 的桌遊網站，讓使用者可以與朋友線上遊玩各種桌遊和益智遊戲。

## 技術堆疊

### 前端
- **框架**：Next.js 15 (App Router)
- **語言**：TypeScript
- **樣式**：Tailwind CSS 4
- **狀態管理**：React Hooks + Context API

### 後端
- **API**：Next.js API Routes
- **資料庫**：PostgreSQL
- **ORM**：Prisma
- **即時通訊**：Socket.IO（獨立伺服器）

### 開發工具
- **版本控制**：Git
- **程式碼檢查**：ESLint
- **型別檢查**：TypeScript strict mode

## 專案結構

### 關鍵目錄
- `src/app/`：Next.js 頁面和 API 路由
- `src/components/`：共用 React 元件
- `src/lib/`：共用邏輯和工具函式
- `prisma/`：資料庫 schema 和 migrations
- `socket-server.js`：Socket.IO 伺服器（獨立運行）

### 重要檔案
- `docs/plan.md`：詳細的專案規劃文件
- `docs/spec.md`：專案規格說明
- `.cursorrules`：Cursor Agent 規則
- `.cursor/`：Cursor 設定和命令

## 核心功能

### 已實作
- 基本專案結構
- Prisma 資料庫設定
- Socket.IO 基礎架構
- 遊戲房間系統（進行中）

### 規劃中
- 使用者認證系統
- 多款遊戲實作
- 遊戲統計系統
- 好友系統

## 開發狀態

### 當前階段
第一階段：基礎建設

### 優先任務
1. 完成遊戲房間系統
2. 實作使用者認證
3. 開發第一款示範遊戲（井字遊戲）

## 參考文件
- 專案規劃：`docs/plan.md`
- 專案規格：`docs/spec.md`
- 開發規則：`.cursorrules`
