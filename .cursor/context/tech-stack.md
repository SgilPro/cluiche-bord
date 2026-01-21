# 技術堆疊詳細說明

## Next.js 15

### App Router
- 使用 App Router 而非 Pages Router
- 伺服器元件為預設，客戶端元件需明確標記 `'use client'`
- API Routes 使用 `route.ts` 檔案

### 重要特性
- 伺服器元件可直接使用 `async/await` 獲取資料
- 自動程式碼分割和優化
- 內建圖片優化

### 參考文件
- [Next.js 15 文件](https://nextjs.org/docs)

## TypeScript

### 設定
- 嚴格模式啟用（`strict: true`）
- 路徑別名：`@/` 指向 `src/`
- 目標版本：ES2017

### 最佳實踐
- 避免使用 `any`
- 優先使用型別推斷
- 明確函式回傳型別

## Prisma

### Schema 位置
`prisma/schema.prisma`

### 資料庫設定
- **資料庫平台**：Supabase PostgreSQL
- **連線方式**：使用環境變數 `DATABASE_URL` 和 `DIRECT_URL`
- **Client 輸出**：`src/generated/prisma`
- **環境變數檔案**：
  - `.env.local`：本地開發環境變數（不提交到 Git）
  - `.env.example`：環境變數範本（可提交到 Git）

### 常用指令
- `npx prisma migrate dev`：建立並執行 migration
- `npx prisma generate`：產生 Prisma Client
- `npx prisma studio`：開啟資料庫管理介面

### 連線測試
- **API 測試**：`GET /api/test-db` - 測試資料庫連線和基本查詢
- **腳本測試**：`scripts/test-db-connection.ts` - 獨立的連線測試腳本

### 查詢模式
- 使用 `include` 獲取關聯資料
- 使用 `select` 選擇特定欄位
- 避免 N+1 查詢問題

### 資料模型
- **User**：使用者資料
- **Game**：遊戲定義
- **GameSession**：遊戲會話
- **GameSessionPlayer**：遊戲會話中的玩家
- **GameSessionAction**：遊戲動作記錄（使用 JSONB 儲存動作資料）

## Socket.IO

### 架構
- 獨立伺服器：`socket-server.js`
- 客戶端連線：`src/lib/socket.ts`
- 事件命名：`namespace:action`

### 連線設定
```typescript
import { getSocket } from '@/lib/socket';
const socket = getSocket();
```

### 伺服器端
- 獨立 Node.js 程序
- 處理即時遊戲狀態同步
- 管理房間和玩家連線

## Tailwind CSS 4

### 使用方式
- 使用 `className` 屬性
- 支援響應式設計（`md:`, `lg:` 等前綴）
- 自訂樣式在 `src/app/globals.css`

## 開發工具

### ESLint
- 使用 Next.js 預設 ESLint 設定
- 執行：`npm run lint`

### Git
- 主分支：`main`
- 開發分支：`develop`
- 功能分支：`feature/*`
- 修復分支：`fix/*`
