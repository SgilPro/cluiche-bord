# 資料庫 Migration 指令

安全地建立和管理 Prisma 資料庫 migration。

## Migration 流程

1. **修改 Schema**
   - 在 `prisma/schema.prisma` 中修改資料模型
   - 確認變更符合需求

2. **建立 Migration**
   - 執行：`npx prisma migrate dev --name migration名稱`
   - Migration 名稱應描述變更內容（如：`add_user_profile`）

3. **檢查 Migration**
   - 檢查 `prisma/migrations/` 中產生的 SQL 檔案
   - 確認 SQL 語句正確無誤
   - 特別注意資料遷移（如需要）

4. **測試 Migration**
   - 在開發環境執行 migration
   - 確認資料庫結構正確更新
   - 測試相關的 API 和功能

5. **更新 Prisma Client**
   - 執行：`npx prisma generate`
   - 確保型別定義同步更新

## 注意事項

- **破壞性變更**：刪除欄位或表格前，確認沒有資料依賴
- **資料遷移**：如有資料需要遷移，在 migration SQL 中加入遷移邏輯
- **回滾計畫**：重大變更前準備回滾方案
- **生產環境**：生產環境使用 `prisma migrate deploy` 而非 `dev`

## 執行方式

在 Agent 聊天框輸入 `/migration` 並描述需要的變更，例如：
```
/migration 在 User 模型中新增 avatar 和 bio 欄位
```

Agent 會自動：
1. 修改 schema.prisma
2. 建立 migration
3. 執行 migration
4. 更新 Prisma Client
