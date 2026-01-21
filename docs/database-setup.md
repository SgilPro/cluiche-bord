# 資料庫設定指南

## 概述

本專案使用 Supabase PostgreSQL 作為資料庫，並透過 Prisma ORM 進行資料庫操作。

## 環境變數設定

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 並登入
2. 建立新專案
3. 選擇地區和計劃
4. 等待專案建立完成

### 2. 取得連線字串

1. 在 Supabase 專案中，前往 **Settings** > **Database**
2. 找到 **Connection string** 區塊
3. 選擇 **URI** 格式
4. 複製連線字串

### 3. 設定環境變數

1. 複製 `.env.example` 為 `.env.local`：
   ```bash
   cp .env.example .env.local
   ```

2. 編輯 `.env.local`，填入實際的連線字串：
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"
   ```

   **注意**：
   - `DATABASE_URL`：用於 Prisma Client 的一般查詢（可使用 connection pooling）
   - `DIRECT_URL`：用於 Migration（需要直接連線，不使用 pooling）
   - Supabase 通常提供兩種連線字串：
     - **Connection Pooling**：用於 `DATABASE_URL`
     - **Direct Connection**：用於 `DIRECT_URL`

## Prisma 設定

### 1. 產生 Prisma Client

```bash
npx prisma generate
```

這會根據 `prisma/schema.prisma` 產生 Prisma Client 到 `src/generated/prisma`。

### 2. 執行 Migration

```bash
npx prisma migrate dev
```

這會：
- 建立新的 migration（如果有 schema 變更）
- 執行所有待處理的 migration
- 更新資料庫結構

### 3. 開啟 Prisma Studio（可選）

```bash
npx prisma studio
```

這會開啟一個網頁介面，方便查看和編輯資料庫資料。

## 測試連線

### 方法 1：使用 API 測試

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 訪問測試端點：
   ```
   http://localhost:3000/api/test-db
   ```

3. 應該會看到 JSON 回應，包含：
   - 連線狀態
   - 使用者數量
   - 動作記錄數量
   - 資料庫表格列表

### 方法 2：使用測試腳本

```bash
npx tsx scripts/test-db-connection.ts
```

**注意**：如果沒有安裝 `tsx`，需要先安裝：
```bash
npm install -D tsx
```

## 資料庫結構

### 主要表格

- **User**：使用者資料
- **Game**：遊戲定義
- **GameSession**：遊戲會話
- **GameSessionPlayer**：遊戲會話中的玩家
- **GameSessionAction**：遊戲動作記錄

### JSONB 欄位

`GameSessionAction.actionData` 使用 JSONB 類型，可以靈活儲存不同遊戲的動作資料。

## 安全性注意事項

1. **不要提交敏感資訊**：
   - `.env.local` 已在 `.gitignore` 中，不會被提交
   - `.env.example` 只包含範本，不包含實際密鑰

2. **連線字串安全**：
   - 連線字串包含資料庫密碼，請妥善保管
   - 不要在公開場所分享連線字串

3. **環境變數管理**：
   - 開發環境：使用 `.env.local`
   - 生產環境：使用部署平台的環境變數設定

## 切換資料庫平台

如果需要切換到其他 PostgreSQL 平台（如 Aiven、Railway 等），只需要：

1. 更新 `.env.local` 中的 `DATABASE_URL` 和 `DIRECT_URL`
2. 執行 `npx prisma migrate deploy` 確保 migration 已套用
3. 不需要修改 Prisma schema 或其他程式碼

## 疑難排解

### 連線失敗

1. 檢查環境變數是否正確設定
2. 確認 Supabase 專案狀態正常
3. 檢查防火牆設定（Supabase 通常不需要額外設定）

### Migration 失敗

1. 確認 `DIRECT_URL` 已設定（不使用 connection pooling）
2. 檢查資料庫權限是否足夠
3. 查看 Prisma 錯誤訊息中的詳細資訊

### Prisma Client 未生成

1. 執行 `npx prisma generate`
2. 檢查 `src/generated/prisma` 目錄是否存在
3. 確認 `prisma/schema.prisma` 語法正確

## 參考資源

- [Prisma 文件](https://www.prisma.io/docs)
- [Supabase 文件](https://supabase.com/docs)
- [PostgreSQL JSONB 文件](https://www.postgresql.org/docs/current/datatype-json.html)
