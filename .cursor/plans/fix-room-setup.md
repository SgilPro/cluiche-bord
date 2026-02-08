# 修復房間建立與開始遊戲流程

## 🔴 發現的問題

### 1. **建立房間時 maxPlayers 不一致**
- `/rooms/page.tsx` 預設是 4 人
- `/page.tsx` 預設是 10 人
- **問題**：狼人殺固定需要 10 人，不應該讓用戶選擇

### 2. **房間建立後沒有明確指定遊戲類型**
- 目前建立房間時只設定 `name` 和 `maxPlayers`
- 沒有指定這是「狼人殺 10 人局」
- **影響**：未來如果要支援多種遊戲，會無法區分

### 3. **isHost 判斷邏輯可能不穩定**
- 目前用 `data.players[0]?.playerId === playerId` 判斷
- 但 `players` 陣列的順序可能不穩定（JSON 儲存可能改變順序）
- **影響**：房主判斷錯誤，導致「開始遊戲」按鈕不顯示

### 4. **等待大廳 UI 顯示問題**
- `roomInfo` 可能沒有正確更新
- 玩家加入後，其他玩家可能看不到更新
- **影響**：看不到當前人數，無法判斷是否可以開始

---

## ✅ 修復方案

### 修復 1：統一房間建立邏輯，固定為狼人殺 10 人局

**檔案**：`src/app/rooms/page.tsx`, `src/app/page.tsx`

**修改**：
1. 建立房間時，固定 `maxPlayers = 10`
2. 移除 `maxPlayers` 選擇器（或改為顯示「狼人殺 10 人局」）
3. 可以考慮在建立房間時就指定 `gameType = "werewolf_10p_sheriff_v1"`

```typescript
// 修改前
const [maxPlayers, setMaxPlayers] = useState(4);

// 修改後
const maxPlayers = 10; // 狼人殺固定 10 人
// 或
const [gameType, setGameType] = useState("werewolf_10p_sheriff_v1");
```

### 修復 2：改善 isHost 判斷邏輯

**檔案**：`src/app/game/[roomId]/page.tsx`, `socket-server.js`

**方案 A（推薦）**：在建立房間時記錄房主
- 在 `Room` 模型中新增 `hostPlayerId` 欄位
- 建立房間時，建立者就是房主
- 判斷時用 `room.hostPlayerId === playerId`

**方案 B（快速修復）**：用第一個加入的玩家作為房主
- 在 `socket-server.js` 的 `join-room` 中，如果是第一個加入的玩家，標記為房主
- 在 `room:joined` 事件中回傳 `hostPlayerId`

**建議先用方案 B**（快速），之後再改成方案 A（更穩定）。

### 修復 3：確保房間資訊正確同步

**檔案**：`socket-server.js`

**問題**：當新玩家加入時，其他玩家可能沒有收到更新的 `roomInfo`

**修復**：
- 在 `join-room` 事件處理中，當玩家成功加入後，廣播更新後的房間資訊給所有房間內的玩家
- 新增事件：`room:updated`，包含最新的玩家列表

```javascript
// 在 join-room 處理中
io.to(roomId).emit("room:updated", {
  roomId,
  players: updatedPlayers,
  maxPlayers: room.maxPlayers,
});
```

### 修復 4：改善等待大廳 UI

**檔案**：`src/app/game/[roomId]/page.tsx`

**改善**：
1. 確保 `room:updated` 事件正確處理
2. 顯示更清楚的狀態：
   - 當前人數 / 10
   - 還需要幾人
   - 房主標記更明顯
3. 當人數 = 10 時，「開始遊戲」按鈕應該明顯啟用

---

## 📋 實作步驟

### Step 1：修復房間建立（固定 10 人）

1. 修改 `src/app/rooms/page.tsx`：
   - 移除 `maxPlayers` state
   - 固定 `maxPlayers = 10`
   - 移除選擇器 UI

2. 修改 `src/app/page.tsx`：
   - 確認 `maxPlayers = 10`（應該已經是了）

3. 可選：在建立房間時加入 `gameType` 欄位

### Step 2：改善 isHost 判斷

1. 修改 `socket-server.js`：
   - 在 `join-room` 處理中，檢查是否是第一個玩家
   - 如果是，在回傳的 `room:joined` 中加入 `hostPlayerId`

2. 修改 `src/app/game/[roomId]/page.tsx`：
   - 用 `data.hostPlayerId === playerId` 判斷是否為房主

### Step 3：房間資訊同步

1. 修改 `socket-server.js`：
   - 在 `join-room` 成功後，廣播 `room:updated` 事件
   - 在 `leave-room` 後也廣播更新

2. 修改 `src/app/game/[roomId]/page.tsx`：
   - 監聽 `room:updated` 事件
   - 更新 `roomInfo` state

### Step 4：測試

1. 建立房間 → 檢查是否固定為 10 人
2. 第一個玩家加入 → 檢查是否正確標記為房主
3. 其他玩家加入 → 檢查是否看到更新的人數
4. 10 人滿員 → 檢查「開始遊戲」按鈕是否啟用
5. 點擊「開始遊戲」 → 檢查是否成功進入遊戲

---

## 🎯 優先順序

1. **高優先級**：修復 1（固定 10 人）、修復 2（isHost 判斷）
2. **中優先級**：修復 3（房間資訊同步）
3. **低優先級**：修復 4（UI 優化）

---

## 📝 注意事項

- 修復時要確保向後相容（現有的房間資料）
- 如果加入 `hostPlayerId` 欄位，需要考慮 migration
- 測試時要用多個瀏覽器 tab 模擬多個玩家
