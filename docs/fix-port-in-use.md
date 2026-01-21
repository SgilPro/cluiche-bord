# 解決 Port 被占用問題

## 錯誤訊息

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:4001
```

這表示 port 4001 已經被其他程序使用。

## 解決方法

### 方法 1：找出並停止占用 port 的程序

```bash
# 找出使用 port 4001 的程序
lsof -ti:4001

# 停止該程序
lsof -ti:4001 | xargs kill -9

# 或一步完成
lsof -ti:4001 | xargs kill -9 && npm run socket-server
```

### 方法 2：找出所有 Node.js 程序並停止

```bash
# 查看所有 Node.js 程序
ps aux | grep node

# 停止所有 Node.js 程序（小心使用！）
pkill -f "node"
```

### 方法 3：使用不同的 port

如果不想停止現有程序，可以修改 `socket-server.js` 使用其他 port：

```javascript
const PORT = process.env.PORT || 4002; // 改用 4002
```

然後記得更新 `.env.local` 中的 `NEXT_PUBLIC_SOCKET_URL`。

## 快速修復腳本

建立一個快速修復腳本：

```bash
# 停止 port 4001 的程序
lsof -ti:4001 | xargs kill -9 2>/dev/null || true

# 啟動 Socket.IO 伺服器
npm run socket-server
```

## 預防措施

在啟動伺服器前，可以先檢查 port 是否被占用：

```bash
# 檢查 port 4001
lsof -ti:4001 && echo "Port 4001 is in use" || echo "Port 4001 is free"
```
