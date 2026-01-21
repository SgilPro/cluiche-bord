# 執行 Room Migration - 快速指南

## 步驟 1：登入 Supabase Dashboard

1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 登入你的帳號
3. 選擇專案：`deeskoeeopiffsdrnmlg`（或你的專案名稱）

## 步驟 2：開啟 SQL Editor

1. 在左側選單中，點擊 **SQL Editor**
2. 點擊 **New query** 按鈕

## 步驟 3：複製並執行 SQL

複製以下 SQL 並貼到編輯器中：

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

## 步驟 4：執行 SQL

1. 點擊 **Run** 按鈕（或按 `Cmd+Enter` / `Ctrl+Enter`）
2. 應該會看到 "Success. No rows returned" 的訊息

## 步驟 5：驗證表格已建立

1. 在左側選單中，點擊 **Table Editor**
2. 應該會看到 `Room` 表格在列表中
3. 點擊 `Room` 表格，確認有以下欄位：
   - `id` (text)
   - `name` (text)
   - `maxPlayers` (integer)
   - `players` (jsonb)
   - `createdAt` (timestamp)
   - `lastActivity` (timestamp)

## 完成！

Migration 執行完成後，你就可以：
- ✅ 建立房間
- ✅ 使用所有房間相關功能
- ✅ 開始測試應用程式

## 疑難排解

### 如果看到錯誤 "relation already exists"
這表示表格已經存在，可以跳過這個步驟。

### 如果看到其他錯誤
請檢查：
- 是否在正確的專案中
- SQL 是否完整複製（包括所有分號）
- 是否有權限執行 DDL 語句
