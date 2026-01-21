# 測試前檢查清單

## ✅ 必須完成的項目

### 1. 資料庫 Migration（重要！）

**必須先執行 Room 表格的 migration，否則無法建立房間。**

#### 執行方式：

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 左側選單 → **SQL Editor**
4. 點擊 **New query**
5. 複製並執行以下 SQL：

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
7. 確認表格已建立（可以在 **Table Editor** 中查看 `Room` 表格）

**如果沒有執行這個 migration，建立房間時會出現資料庫錯誤！**

### 2. 環境變數設定

確認 `.env` 或 `.env.local` 中有以下設定：

```env
# 資料庫連線（必須）
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Socket.IO 連線（如果要在 WLAN 中使用）
NEXT_PUBLIC_SOCKET_URL=ws://YOUR_LOCAL_IP:4001
```

### 3. Prisma Client 已生成

確認已執行：
```bash
npx prisma generate
```

應該會在 `src/generated/prisma` 目錄看到生成的檔案。

## 🚀 啟動步驟

### 步驟 1：啟動 Next.js 伺服器

```bash
npm run dev
```

應該會看到：
```
- Local:        http://localhost:3000
- Network:      http://192.168.0.117:3000
```

### 步驟 2：啟動 Socket.IO 伺服器

在另一個終端機：
```bash
node socket-server.js
```

應該會看到：
```
Socket.IO server running
  Local:   ws://localhost:4001
  Network: ws://<your-local-ip>:4001
```

## 🧪 測試項目

### 基本功能測試

1. **訪問首頁**
   - 打開 `http://localhost:3000`
   - 確認頁面正常載入

2. **測試資料庫連線**
   - 訪問 `http://localhost:3000/api/test-db`
   - 應該看到 JSON 回應，包含連線狀態和表格列表
   - 確認 `Room` 表格在列表中

3. **建立房間**
   - 點擊「建立房間」按鈕
   - 輸入房間名稱和最大玩家數
   - 確認可以成功建立
   - 確認自動跳轉到遊戲房間頁面

4. **查看 QR Code**
   - 在遊戲房間頁面，確認 QR Code 顯示
   - 確認網址格式正確：`http://YOUR_IP:3000/game/<room_id>`

5. **Socket.IO 連線**
   - 打開瀏覽器開發者工具（F12）
   - 查看 Console，應該看到 "Socket connected successfully"
   - 確認沒有連線錯誤

### WLAN 測試（可選）

如果要在其他設備測試：

1. **找出區域網路 IP**
   ```bash
   ./scripts/find-local-ip.sh
   ```

2. **設定 Socket.IO URL**
   在 `.env.local` 中：
   ```env
   NEXT_PUBLIC_SOCKET_URL=ws://YOUR_LOCAL_IP:4001
   ```

3. **從其他設備訪問**
   - 在同一 WLAN 的設備上訪問：`http://YOUR_IP:3000`
   - 掃描 QR Code 加入房間
   - 測試聊天功能

## ❌ 常見問題

### 問題 1：建立房間失敗

**可能原因：**
- ❌ Room 表格未建立（未執行 migration）
- ❌ 資料庫連線失敗
- ❌ Prisma Client 未生成

**解決方法：**
1. 確認已執行 migration（見上方步驟 1）
2. 檢查 `.env` 中的 `DATABASE_URL` 是否正確
3. 執行 `npx prisma generate`

### 問題 2：Socket.IO 無法連線

**可能原因：**
- ❌ Socket.IO 伺服器未啟動
- ❌ `NEXT_PUBLIC_SOCKET_URL` 設定錯誤
- ❌ 防火牆阻擋

**解決方法：**
1. 確認 `node socket-server.js` 正在運行
2. 檢查 `.env.local` 中的 `NEXT_PUBLIC_SOCKET_URL`
3. 檢查防火牆設定

### 問題 3：QR Code 網址錯誤

**可能原因：**
- ❌ 使用 localhost 而非區域網路 IP

**解決方法：**
- 使用區域網路 IP 訪問（如 `http://192.168.0.117:3000`）
- QR Code 會自動使用當前網址

## 📋 快速檢查清單

在開始測試前，確認：

- [ ] 已執行 Room 表格的 migration
- [ ] `.env` 或 `.env.local` 中有 `DATABASE_URL`
- [ ] 已執行 `npx prisma generate`
- [ ] Next.js 伺服器正在運行（port 3000）
- [ ] Socket.IO 伺服器正在運行（port 4001）
- [ ] 可以訪問 `http://localhost:3000/api/test-db` 並看到 Room 表格
- [ ] （可選）已設定 `NEXT_PUBLIC_SOCKET_URL` 用於 WLAN 連線

## 🎯 準備就緒！

如果以上項目都完成，就可以開始測試了！
