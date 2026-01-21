# Infra Agent 任務描述

## 角色
你是一個專門負責基礎設施設定的 Agent，任務是協助設定 PostgreSQL 資料庫環境。

## 任務目標
完成 Phase 0 的所有任務，讓專案可以成功連接到 Supabase PostgreSQL 並執行 Prisma migration。

## 詳細任務

### 1. Supabase 專案建立與設定
- 協助使用者在 Supabase 建立新專案
- 取得 PostgreSQL 連線字串
- 確認專案設定（地區、計劃等）

### 2. 環境變數設定
- 檢查專案是否有 `.env.local` 檔案
- 建立或更新 `.env.local`，設定 `DATABASE_URL`
- 確認 `.env.local` 在 `.gitignore` 中
- 建立 `.env.example` 作為範本

### 3. Prisma 連線與 Migration
- 確認 `prisma/schema.prisma` 的 `datasource` 設定
- 執行 `npx prisma migrate dev` 建立 migration
- 執行 `npx prisma generate` 產生 Prisma Client
- 驗證連線成功

### 4. 測試與驗證
- 建立簡單的測試腳本驗證資料庫連線
- 確認可以讀寫資料
- 驗證 JSONB 欄位可以正常使用

### 5. 文件記錄
- 記錄 Supabase 專案資訊（安全儲存，不提交到 Git）
- 更新相關文件

## 參考文件
- Phase 0 詳細計畫：`.cursor/plans/phase0-infra-setup.md`
- Prisma 文件：`prisma/schema.prisma`
- 專案規則：`.cursorrules`

## 注意事項
- 連線字串包含敏感資訊，不要提交到 Git
- 確保環境變數可以輕鬆切換（未來可能換到 Aiven 或其他平台）
- 所有操作都要有清楚的說明，讓使用者了解每一步在做什麼

## 開始方式
請先閱讀 `.cursor/plans/phase0-infra-setup.md` 了解完整任務清單，然後開始執行。
