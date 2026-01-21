# 架構規範

## 專案結構

### 目錄組織
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/         # 頁面專用元件
│   └── [routes]/          # 路由頁面
├── components/             # 共用元件
│   ├── ui/                # 基礎 UI 元件
│   └── game/              # 遊戲相關元件
├── lib/                    # 共用邏輯
│   ├── games/             # 遊戲邏輯系統
│   ├── db/                # 資料庫相關
│   └── utils/             # 工具函式
└── types/                  # 全域型別定義
```

### 元件層級
1. **頁面元件**（`src/app/`）：路由頁面，負責資料獲取和頁面結構
2. **功能元件**（`src/components/`）：可重用的功能元件
3. **UI 元件**（`src/components/ui/`）：基礎 UI 元件（按鈕、輸入框等）

## API 設計

### RESTful 規範
- **GET**：查詢資源
- **POST**：建立資源
- **PUT/PATCH**：更新資源
- **DELETE**：刪除資源

### API 路由結構
```
src/app/api/
├── rooms/
│   ├── route.ts           # GET, POST /api/rooms
│   └── [id]/
│       └── route.ts       # GET, PUT, DELETE /api/rooms/[id]
├── games/
│   └── route.ts           # GET /api/games
└── auth/
    └── route.ts           # POST /api/auth
```

### 回應格式
```typescript
// 成功回應
{
  data: T,
  message?: string
}

// 錯誤回應
{
  error: string,
  message: string,
  details?: unknown
}
```

## Socket.IO 架構

### 事件命名規範
- **格式**：`namespace:action`
- **範例**：
  - `room:join` - 加入房間
  - `room:leave` - 離開房間
  - `game:move` - 遊戲移動
  - `chat:message` - 聊天訊息

### 連線管理
- 所有 Socket.IO 連線統一透過 `src/lib/socket.ts` 管理
- 伺服器端邏輯在 `socket-server.js` 中處理
- 客戶端使用封裝的 Hook 或函式與 Socket.IO 互動

## 資料庫架構

### Prisma Schema 組織
- 每個模型應有明確的用途
- 使用關聯而非重複資料
- 適當使用索引優化查詢效能

### 查詢模式
- **避免 N+1 查詢**：使用 `include` 或 `select` 一次獲取相關資料
- **使用事務**：相關操作應在事務中執行
- **錯誤處理**：所有資料庫操作都應有錯誤處理

## 遊戲邏輯架構

### 核心抽象層
- **GameEngine**：遊戲引擎核心，處理遊戲狀態和規則
- **StateManager**：狀態管理，處理遊戲狀態變更
- **EventHandler**：事件處理，處理玩家操作和遊戲事件

### 遊戲實作
- 每個遊戲應實作統一的遊戲介面
- 遊戲邏輯與 UI 分離
- 使用型別定義確保型別安全

## 狀態管理

### 目前策略
- **React Hooks**：使用 `useState`, `useReducer` 管理本地狀態
- **Context API**：跨元件共享狀態
- **未來考慮**：Zustand 或 Redux Toolkit

### 狀態組織
- **伺服器狀態**：透過 API 獲取，使用 React Query 或 SWR（未來）
- **客戶端狀態**：使用 React Hooks 或 Context
- **Socket.IO 狀態**：透過 Socket.IO 事件同步

## 安全性架構

### 認證流程
- 使用 NextAuth.js（未來實作）
- API 路由檢查認證狀態
- Socket.IO 連線驗證 token

### 授權檢查
- 資源層級的權限檢查
- 角色基礎的存取控制（RBAC）
- API 路由中間件驗證

## 效能優化

### 前端優化
- 程式碼分割和動態導入
- 圖片優化（Next.js Image）
- 適當的快取策略

### 後端優化
- 資料庫查詢優化
- API 回應快取
- 連線池管理
