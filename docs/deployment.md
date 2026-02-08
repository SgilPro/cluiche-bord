# Next.js + Socket.IO 部署方案（DEV-9）

**結論建議（短期）**

採用「前端/REST（Next.js）與 Socket.IO 拆分部署」：

- Next.js 放在 Vercel（或任一支援 Node runtime 的平台）
- Socket.IO 放在長時間運作的 Node 服務（Render/Fly.io/Railway/EC2 等）

理由：Next.js 的 serverless/edge 無法穩定承載長連線 WebSocket，而 Socket.IO 又必須常駐。現階段遊戲狀態存於記憶體，最務實做法是單一 Socket 服務實例，搭配獨立可控的 Node 主機。

---

## 方案比較

**方案 A：拆分部署（推薦）**

- Next.js：Vercel / Node hosting
- Socket.IO：獨立 Node 主機

Pros
- 符合 Next.js 既有最佳化（CDN、ISR、快取）
- Socket.IO 可以常駐、連線穩定
- 兩端可各自擴充、維運獨立

Cons
- 需管理兩個服務與兩套環境變數
- 需要處理 CORS 與跨網域連線

**方案 B：單一主機同時跑 Next.js + Socket.IO**

- 用同一台 VM 或單一容器跑 `next start` + `node socket-server.js`
- 可用 Nginx 或 Caddy 反向代理，走同網域同 TLS

Pros
- CORS 幾乎不需要（同網域）
- 架構簡單、部署一個地方即可

Cons
- 無 Vercel 的 CDN/ISR 最佳化
- 單點，運維負擔高
- 仍然是單實例，橫向擴展困難

**方案 C：改用受管即時服務（如 Pusher/Ably）**

- Next.js 留在 Vercel
- 即時層改用第三方 Realtime 平台

Pros
- 可大幅降低 Socket 服務維運成本
- 可自然水平擴充

Cons
- 需改寫即時通訊層
- 成本與供應商綁定

---

## 建議方案與落地方式

**建議採用方案 A**，原因如下：

- 符合目前程式碼結構（`socket-server.ts` 為獨立 Node 服務）
- 短期可以維持單實例，避免遊戲狀態同步問題
- 升級路線清楚：未來若要多實例擴展，再加入 Redis adapter 與共享狀態

**擴展注意事項（未來）**

- 目前遊戲狀態是記憶體內 `Map`，多實例時會導致狀態不一致
- 若要擴展，先將 `gameStates` 搬到共享儲存（Redis/DB）
- 若要擴展，使用 `socket.io-redis` adapter
- 若要擴展，確保 sticky session 或 upgrade 維持在同一實例

---

## 環境變數整理

**共用/Server（Next.js API 與 Socket.IO Server）**

- `DATABASE_URL`：Prisma 主要連線字串
- `DIRECT_URL`：Supabase direct connection（避免 pooler prepared statement 問題）

**Socket.IO Server 專用**

- `PORT`（預設 `4001`）
- `HOST`（預設 `0.0.0.0`）
- `NODE_ENV`（`development` / `production`）

**Next.js Client（瀏覽器側）**

- `NEXT_PUBLIC_SOCKET_URL`：Socket.IO 連線網址。開發為 `http://localhost:4001`，產線為 `https://socket.example.com`
- `NEXT_PUBLIC_BASE_URL`：用於 QR Code 與連結顯示，例如 `https://app.example.com`

---

## CORS 與 Port 設定

**開發預設**

- Next.js：`http://localhost:3000`
- Socket.IO：`http://localhost:4001`
- `NEXT_PUBLIC_SOCKET_URL=http://localhost:4001`

**產線常見組合**

- 前端：`https://app.example.com`
- Socket：`https://socket.example.com`

**CORS 建議**

- `socket-server.ts` 目前是 `origin: "*"`，開發方便
- 產線建議改為白名單，例如 `origin: ["https://app.example.com"]`
- 若採同網域反向代理（`/socket.io`），可不需要 CORS

**Port 提醒**

- 若 Socket 走獨立 domain，建議走 443（TLS）
- `NEXT_PUBLIC_SOCKET_URL` 請使用 `https://`（Socket.IO 會自動升級為 `wss://`）

---

## 最小可行部署步驟（方案 A）

1. 部署 Next.js 到 Vercel（或任一支援 Node 的平台）
2. 部署 `socket-server.ts` 到長時間運作的 Node 主機
3. 於 Next.js 環境設定 `NEXT_PUBLIC_SOCKET_URL=https://socket.example.com` 與 `NEXT_PUBLIC_BASE_URL=https://app.example.com`
4. 於 Socket 主機環境設定 `DATABASE_URL`, `DIRECT_URL`, `PORT=4001`（或反向代理的內部 port）
5. 確認 CORS 與防火牆開放（Socket port 可對外連）
