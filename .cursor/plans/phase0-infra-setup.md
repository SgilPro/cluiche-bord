# Phase 0: PostgreSQL 基礎設施設定

## 目標
設定 Supabase PostgreSQL 資料庫，並完成 Prisma 連線與 migration 驗證。

## 任務範圍

### 1. Supabase 專案建立
- [ ] 在 Supabase 建立新專案
- [ ] 記錄專案 URL 和 API keys
- [ ] 取得 PostgreSQL 連線字串（`DATABASE_URL`）
- [ ] 確認是否需要 `DIRECT_URL`（用於 migration）

### 2. 環境變數設定
- [ ] 建立 `.env.local` 檔案（如果不存在）
- [ ] 設定以下環境變數：
  ```env
  DATABASE_URL="postgresql://..."
  DIRECT_URL="postgresql://..."  # 如果需要
  ```
- [ ] 確認 `.env.local` 已在 `.gitignore` 中（避免提交敏感資訊）
- [ ] 建立 `.env.example` 作為範本（不含實際密鑰）

### 3. Prisma 連線驗證
- [ ] 更新 `prisma/schema.prisma` 確認 `datasource` 設定正確
- [ ] 執行 `npx prisma migrate dev` 建立初始 migration
- [ ] 確認 migration 成功執行
- [ ] 執行 `npx prisma generate` 產生 Prisma Client
- [ ] 驗證 `src/generated/prisma` 目錄有正確產生

### 4. 連線測試
- [ ] 建立簡單的測試腳本或 API route 測試 Prisma 連線
- [ ] 確認可以讀寫資料庫
- [ ] 驗證 JSONB 欄位可以正常使用（為未來的遊戲狀態做準備）

### 5. 文件記錄
- [ ] 記錄 Supabase 專案的連線資訊（儲存在安全的地方，不要提交到 Git）
- [ ] 更新 `.cursor/context/tech-stack.md` 記錄資料庫設定
- [ ] 在 README 或文件說明如何設定環境變數

## 注意事項

### 連線字串可抽換性
- 確保 `DATABASE_URL` 可以透過環境變數輕鬆切換
- 未來如果要換到 Aiven 或其他平台，只需要更新環境變數即可
- Prisma schema 本身不應該包含平台特定的設定

### 安全性
- 不要將 `.env.local` 提交到 Git
- 連線字串包含敏感資訊，妥善保管
- 如果使用 Supabase，考慮使用專案級別的 API keys 而非 service role keys（用於前端）

### 備份策略
- Supabase 有自動備份，但建議了解如何手動備份
- 記錄如何匯出/匯入資料（使用 `pg_dump` / `psql`）

## 驗收標準
- [ ] 可以成功執行 `npx prisma migrate dev`
- [ ] 可以成功執行 `npx prisma generate`
- [ ] 可以透過 Prisma Client 讀寫資料庫
- [ ] 環境變數設定正確，可以從不同環境切換

## 相關檔案
- `prisma/schema.prisma` - Prisma schema 定義
- `.env.local` - 本地環境變數（不提交到 Git）
- `.env.example` - 環境變數範本
- `src/generated/prisma/` - Prisma Client 產出目錄

## 後續步驟
完成後，可以進行 Phase 1：房間持久化重構。
