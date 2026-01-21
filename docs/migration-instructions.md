# 執行 Room Migration 說明

## 概述

Phase 1 重構已經完成，但需要在 Supabase 資料庫中執行 migration 來建立 `Room` 表格。

## Migration 檔案位置

Migration SQL 檔案位於：
```
prisma/migrations/20250121220000_add_room_model/migration.sql
```

## 執行方式

### 方式 1：使用 Supabase Dashboard（推薦）

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 左側選單 → **SQL Editor**
4. 點擊 **New query**
5. 複製以下 SQL 並貼上：

```sql
-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "players" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_lastActivity_idx" ON "Room"("lastActivity");

-- CreateIndex
CREATE INDEX "Room_createdAt_idx" ON "Room"("createdAt");
```

6. 點擊 **Run** 執行
7. 確認表格已建立（可以在 **Table Editor** 中查看）

### 方式 2：使用 Prisma CLI（如果 DIRECT_URL 可用）

如果未來 `DIRECT_URL` 可以正常連線，可以使用：

```bash
npx prisma migrate deploy
```

## 驗證 Migration

執行 migration 後，可以透過以下方式驗證：

1. **Supabase Dashboard**：
   - Table Editor → 應該可以看到 `Room` 表格
   - 檢查表格結構是否正確

2. **API 測試**：
   ```bash
   npm run dev
   # 訪問 http://localhost:3000/api/test-db
   # 應該可以看到 Room 在 tables 列表中
   ```

3. **建立測試房間**：
   ```bash
   curl -X POST http://localhost:3000/api/rooms \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Room", "maxPlayers": 4}'
   ```

## 注意事項

- Migration 只需要執行一次
- 如果已經執行過，不需要重複執行
- 執行前請確認資料庫連線正常
