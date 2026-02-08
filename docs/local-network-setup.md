# 本地網路開發設定指南

## 概述

本指南說明如何在本地電腦運行兩個伺服器，並讓同一 WLAN 網路中的其他設備（手機、平板、其他電腦）連線。

## 步驟 1：找出你的區域網路 IP

### macOS / Linux
```bash
# 方法 1：使用 ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# 方法 2：使用 ipconfig (macOS)
ipconfig getifaddr en0  # 無線網路
ipconfig getifaddr en1  # 有線網路

# 方法 3：查看網路設定
# 系統偏好設定 > 網路 > 查看 IP 位址
```

### Windows
```cmd
ipconfig
# 找到 "IPv4 位址"，通常是 192.168.x.x 或 10.0.x.x
```

**範例 IP**：`192.168.0.117`（你的會不同）

## 步驟 2：設定環境變數

### 方法 A：使用 `.env.local`（推薦）

在專案根目錄建立或編輯 `.env.local`：

```env
# 將 YOUR_LOCAL_IP 替換為你的區域網路 IP
# 基礎網址（用於 QR Code 和連結）
NEXT_PUBLIC_BASE_URL=http://YOUR_LOCAL_IP:3000

# Socket.IO 伺服器網址（用於即時通訊）
NEXT_PUBLIC_SOCKET_URL=ws://YOUR_LOCAL_IP:4001
```

**範例**：
```env
NEXT_PUBLIC_BASE_URL=http://192.168.0.117:3000
NEXT_PUBLIC_SOCKET_URL=ws://192.168.0.117:4001
```

**重要**：
- `NEXT_PUBLIC_BASE_URL`：用於 QR Code 和所有連結，讓其他設備可以掃描加入
- `NEXT_PUBLIC_SOCKET_URL`：用於 Socket.IO 即時通訊連線
- 兩個都必須設定為相同的 IP 位址

### 方法 B：臨時設定（每次啟動時）

```bash
# macOS / Linux
NEXT_PUBLIC_SOCKET_URL=ws://192.168.0.117:4001 npm run dev

# Windows (PowerShell)
$env:NEXT_PUBLIC_SOCKET_URL="ws://192.168.0.117:4001"; npm run dev
```

## 步驟 3：確保伺服器監聽所有網路介面

### Next.js 伺服器
Next.js 預設會監聽所有介面（`0.0.0.0`），所以不需要特別設定。

### Socket.IO 伺服器
檢查 `socket-server.js` 是否正確設定：

```javascript
server.listen(4001, '0.0.0.0', () => {
  console.log("Socket.IO server running on port 4001");
  console.log("Local: http://localhost:4001");
  console.log("Network: http://YOUR_LOCAL_IP:4001");
});
```

如果沒有指定 host，預設會監聽所有介面，但明確指定更安全。

## 步驟 4：檢查防火牆設定

### macOS
1. 系統偏好設定 > 安全性與隱私 > 防火牆
2. 如果防火牆開啟，確保允許 Node.js 的連入連線
3. 或暫時關閉防火牆進行測試

### Windows
1. 控制台 > Windows Defender 防火牆
2. 允許 Node.js 通過防火牆
3. 或暫時關閉防火牆進行測試

### Linux
```bash
# 如果使用 ufw
sudo ufw allow 3000/tcp
sudo ufw allow 4001/tcp

# 如果使用 firewalld
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --add-port=4001/tcp --permanent
sudo firewall-cmd --reload
```

## 步驟 5：啟動伺服器

### 終端機 1：Next.js 伺服器
```bash
npm run dev
```

應該會看到：
```
- Local:        http://localhost:3000
- Network:      http://192.168.0.117:3000
```

### 終端機 2：Socket.IO 伺服器
```bash
node socket-server.js
```

應該會看到：
```
Socket.IO server running on port 4001
```

## 步驟 6：從其他設備連線

### 在同一 WLAN 網路中的設備

1. **開啟瀏覽器**（手機、平板、其他電腦）
2. **輸入網址**：
   ```
   http://YOUR_LOCAL_IP:3000
   ```
   例如：`http://192.168.0.117:3000`

3. **確認 Socket.IO 連線**：
   - 打開瀏覽器開發者工具（F12）
   - 查看 Console，應該看到 "Socket connected successfully"

## 疑難排解

### 問題 1：無法連線
- ✅ 確認所有設備都在同一個 WLAN 網路
- ✅ 確認防火牆允許連線
- ✅ 確認 IP 位址正確
- ✅ 確認兩個伺服器都在運行

### 問題 2：Socket.IO 無法連線
- ✅ 檢查 `.env.local` 中的 `NEXT_PUBLIC_SOCKET_URL` 設定
- ✅ 確認 Socket.IO 伺服器監聽在 `0.0.0.0:4001`
- ✅ 檢查瀏覽器 Console 的錯誤訊息

### 問題 3：IP 位址變更
如果路由器重新分配 IP（DHCP），需要：
1. 重新查詢 IP 位址
2. 更新 `.env.local` 中的 IP
3. 重啟 Next.js 伺服器

### 問題 4：使用固定 IP（可選）
如果希望 IP 不變，可以在路由器設定中為你的電腦分配固定 IP。

## 快速檢查清單

- [ ] 找出區域網路 IP
- [ ] 設定 `.env.local` 中的 `NEXT_PUBLIC_SOCKET_URL`
- [ ] 確認防火牆允許連線
- [ ] 啟動 Next.js 伺服器（port 3000）
- [ ] 啟動 Socket.IO 伺服器（port 4001）
- [ ] 從其他設備訪問 `http://YOUR_IP:3000`
- [ ] 檢查 Socket.IO 連線狀態

## 注意事項

1. **安全性**：本地開發環境不應該暴露到公網
2. **IP 變更**：如果 IP 變更，需要更新設定
3. **路由器設定**：某些路由器可能阻擋設備間通訊，需要檢查設定

## 下一步

測試完成後，可以：
- 從手機、平板等多個設備同時連線測試
- 測試建立房間、加入房間等功能
- 確認即時同步是否正常
