# 啟動伺服器指南

## 概述

本專案需要同時運行兩個伺服器：
1. **Next.js 伺服器**：前端頁面和 RESTful API（port 3000）
2. **Socket.IO 伺服器**：即時通訊服務（port 4001）

## 方式一：使用兩個終端機（推薦）

### 終端機 1：啟動 Next.js 伺服器

```bash
# 進入專案目錄（如果還沒進入）
cd /Users/d9niel/_projects/cluiche-bord

# 啟動 Next.js 開發伺服器
npm run dev
```

**應該會看到：**
```
▲ Next.js 15.3.2
- Local:        http://localhost:3000
- Network:      http://192.168.0.117:3000

✓ Ready in XXXXms
```

**保持這個終端機開啟！**

### 終端機 2：啟動 Socket.IO 伺服器

打開**新的終端機視窗**，然後：

```bash
# 進入專案目錄
cd /Users/d9niel/_projects/cluiche-bord

# 啟動 Socket.IO 伺服器
node socket-server.js
```

**應該會看到：**
```
Socket.IO server running
  Local:   ws://localhost:4001
  Network: ws://<your-local-ip>:4001

  To find your local IP:
    macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
    Windows: ipconfig
```

**保持這個終端機也開啟！**

## 方式二：使用背景執行（進階）

如果你想在同一個終端機中執行，可以使用背景執行：

### 啟動 Next.js（背景執行）

```bash
npm run dev &
```

### 啟動 Socket.IO（背景執行）

```bash
node socket-server.js &
```

### 查看背景程序

```bash
# 查看所有 Node.js 程序
ps aux | grep node

# 停止所有 Node.js 程序
pkill -f "node"
```

## 方式三：使用 npm scripts（可選）

如果你想更方便，可以在 `package.json` 中加入腳本：

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:socket": "node socket-server.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:socket\""
  }
}
```

然後安裝 `concurrently`：
```bash
npm install --save-dev concurrently
```

之後就可以用：
```bash
npm run dev:all
```

## 驗證伺服器是否正常運行

### 1. 檢查 Next.js 伺服器

打開瀏覽器訪問：
- `http://localhost:3000` - 應該看到首頁
- `http://localhost:3000/api/test-db` - 應該看到資料庫測試結果

### 2. 檢查 Socket.IO 伺服器

打開瀏覽器開發者工具（F12），在 Console 中應該看到：
```
Socket connected successfully
Connection confirmed by server: { id: "..." }
```

## 停止伺服器

### 方式一：在終端機中按快捷鍵

- **macOS/Linux**: `Ctrl + C`
- **Windows**: `Ctrl + C`

### 方式二：強制停止

如果伺服器沒有正常停止：

```bash
# 停止所有 Node.js 程序
pkill -f "node"

# 或停止特定 port 的程序
lsof -ti:3000 | xargs kill -9  # Next.js
lsof -ti:4001 | xargs kill -9  # Socket.IO
```

## 常見問題

### 問題 1：Port 3000 已被使用

**錯誤訊息：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解決方法：**
```bash
# 找出使用 port 3000 的程序
lsof -ti:3000

# 停止該程序
lsof -ti:3000 | xargs kill -9

# 或使用其他 port
PORT=3001 npm run dev
```

### 問題 2：Port 4001 已被使用

**錯誤訊息：**
```
Error: listen EADDRINUSE: address already in use :::4001
```

**解決方法：**
```bash
# 找出使用 port 4001 的程序
lsof -ti:4001

# 停止該程序
lsof -ti:4001 | xargs kill -9

# 或修改 socket-server.js 使用其他 port
PORT=4002 node socket-server.js
```

### 問題 3：Socket.IO 無法連線

**檢查項目：**
1. ✅ Socket.IO 伺服器是否正在運行
2. ✅ `.env.local` 中是否有 `NEXT_PUBLIC_SOCKET_URL` 設定
3. ✅ 瀏覽器 Console 是否有錯誤訊息

## 快速檢查清單

在開始測試前，確認：

- [ ] Next.js 伺服器正在運行（終端機 1）
- [ ] Socket.IO 伺服器正在運行（終端機 2）
- [ ] 可以訪問 `http://localhost:3000`
- [ ] 瀏覽器 Console 顯示 "Socket connected successfully"
- [ ] 沒有錯誤訊息

## 下一步

兩個伺服器都啟動後，就可以：
1. 訪問 `http://localhost:3000` 開始使用
2. 建立房間
3. 測試 QR Code
4. 測試即時通訊功能
