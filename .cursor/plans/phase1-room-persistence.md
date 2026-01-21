# Phase 1: 房間持久化重構

## 目標
將房間系統從檔案系統（`data/rooms.json`）遷移到 PostgreSQL（Prisma），同時保持現有前端與 Socket.IO 行為不變。

## 背景
目前房間資料儲存在 `data/rooms.json`，需要遷移到資料庫以支援：
- 更好的並發處理
- 資料持久化
- 未來的擴展性

## 任務範圍

### 1. Prisma Schema 調整
- [ ] 檢視現有的 `GameSession` 模型是否符合需求
- [ ] 如果需要，新增或調整模型以支援：
  - 房間代碼（6 位數 ID）
  - 房間名稱
  - 最大玩家數
  - 當前玩家列表（可以用 JSON 或關聯表）
  - 房間狀態（waiting, playing, finished）
  - 建立時間、最後活動時間
- [ ] 考慮是否需要獨立的 `Room` 模型，還是直接使用 `GameSession`
- [ ] 建立 migration：`npx prisma migrate dev --name add_room_fields`

### 2. 資料庫操作層（Repository Pattern）
- [ ] 建立 `src/lib/db/rooms.ts` 或類似檔案
- [ ] 實作以下函式：
  ```typescript
  // 建立房間
  async function createRoom(data: {
    name: string;
    maxPlayers: number;
    gameId?: string; // 未來用於指定遊戲類型
  }): Promise<Room>
  
  // 取得房間列表（可用房間）
  async function getAvailableRooms(): Promise<Room[]>
  
  // 取得單一房間
  async function getRoomById(roomId: string): Promise<Room | null>
  
  // 更新房間活動時間
  async function updateRoomActivity(roomId: string): Promise<void>
  
  // 刪除房間
  async function deleteRoom(roomId: string): Promise<boolean>
  
  // 更新房間玩家列表
  async function updateRoomPlayers(
    roomId: string, 
    playerId: string, 
    isJoining: boolean
  ): Promise<void>
  ```

### 3. API Routes 重構
- [ ] 修改 `src/app/api/rooms/route.ts`：
  - `GET`: 從 Prisma 讀取房間列表
  - `POST`: 使用 Prisma 建立房間
  - `DELETE`: 使用 Prisma 刪除房間
- [ ] 移除檔案系統相關的程式碼（`readRooms`, `writeRooms` 等）
- [ ] 保留自動清理邏輯，但改為資料庫查詢
- [ ] 確保 API 回應格式與現有前端相容

### 4. Socket.IO 伺服器更新
- [ ] 修改 `socket-server.js`：
  - 將 `updateRoomPlayers` 改為使用 Prisma
  - 需要引入 Prisma Client
  - 處理 Prisma 在 Node.js 環境的使用
- [ ] 確保玩家加入/離開時正確更新資料庫
- [ ] 保持現有的 Socket.IO 事件不變（`join-room`, `leave-room`, `user-joined`, `user-left`）

### 5. 自動清理機制
- [ ] 實作資料庫版本的房間清理邏輯：
  - 查詢空房間且最後活動時間超過 5 分鐘
  - 或空房間且建立時間超過 10 分鐘
  - 刪除符合條件的房間
- [ ] 可以考慮：
  - 在 API GET 請求時執行清理（現有方式）
  - 或使用定時任務（cron job）
  - 或使用 Supabase 的 Edge Functions / pg_cron

### 6. 資料遷移（可選）
- [ ] 如果需要保留現有 `data/rooms.json` 的資料：
  - 建立一次性遷移腳本
  - 讀取 JSON 檔案並寫入資料庫
- [ ] 如果不需要，直接清空檔案系統資料

### 7. 測試與驗證
- [ ] 測試建立房間功能
- [ ] 測試取得房間列表
- [ ] 測試加入/離開房間
- [ ] 測試自動清理機制
- [ ] 確認前端行為與之前一致
- [ ] 確認 Socket.IO 即時同步正常

## 技術考量

### 房間 ID 生成
- 目前使用：`Math.random().toString(36).substring(2, 8).toUpperCase()`
- 需要確保資料庫中唯一性
- 可以考慮：
  - 在 Prisma schema 使用 `@default(uuid())` 但轉換為 6 位數代碼
  - 或使用資料庫的序列（sequence）生成唯一 6 位數代碼
  - 或保持現有邏輯，但在建立時檢查唯一性

### 玩家識別
- 目前使用 `socket.id` 作為玩家 ID
- Phase 1 階段保持此方式
- 未來 Phase 2 可以加入暱稱系統

### 並發處理
- 使用 Prisma 的事務處理確保資料一致性
- 特別注意玩家加入/離開時的並發情況

## 檔案變更清單
- `prisma/schema.prisma` - 可能需要調整模型
- `src/app/api/rooms/route.ts` - 重構為使用 Prisma
- `socket-server.js` - 更新為使用 Prisma
- `src/lib/db/rooms.ts` - 新增資料庫操作層（新建）
- `data/rooms.json` - 可以移除或保留作為備份

## 驗收標準
- [ ] 可以成功建立房間並儲存到資料庫
- [ ] 可以從資料庫讀取房間列表
- [ ] 前端顯示的房間列表與之前一致
- [ ] Socket.IO 的加入/離開功能正常
- [ ] 自動清理機制正常運作
- [ ] 沒有檔案系統依賴

## 後續步驟
完成後，可以進行 Phase 2：狼人殺遊戲實作。
