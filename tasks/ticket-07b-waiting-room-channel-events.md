# Ticket 07b — 等待室 player_joined / player_left channel events

## 目標

後端 spec 006 已實作 `player_joined` / `player_left` broadcast。
前端等待室目前只靠 REST polling（3s）更新玩家列表；
需改為同時監聽 channel events，達到即時更新。

## Spec 說明

Payload 結構（兩個 event 相同）：
```json
{ "players": [{ "user_id": "...", "nickname": "..." }] }
```
前端收到後**直接取代**整個 `room.players` 陣列（不需 merge）。

## 範圍

- `src/lib/channel/types.ts` — 加入新 event 型別
- `src/app/rooms/[roomId]/page.tsx` — 監聽 channel events

## types.ts 更新

在 `WerewolfChannelEvent` 加入：
```ts
export type WerewolfChannelEvent =
  | "state"
  | "phase_change"
  | "sheriff_elected"
  | "death_announcement"
  | "victory"
  | "role_action_result"
  | "vote_tie"
  | "vote_no_exile"
  | "player_joined"   // 新增
  | "player_left";    // 新增
```

新增 payload 型別：
```ts
export interface RoomPlayerPayload {
  user_id: string;
  nickname: string;
}

export interface PlayerJoinedPayload {
  players: RoomPlayerPayload[];
}

export interface PlayerLeftPayload {
  players: RoomPlayerPayload[];
}
```

## waiting room page 更新

在現有的 channel `.then(() => { ch.on("state", ...) ... })` 區塊中，加入：

```ts
// 即時更新等待室玩家列表（spec 006）
ch.on("player_joined", (payload) => {
  const { players } = payload as { players: Array<{ user_id: string; nickname: string }> };
  setRoom((prev) => (prev ? { ...prev, players } : prev));
});

ch.on("player_left", (payload) => {
  const { players } = payload as { players: Array<{ user_id: string; nickname: string }> };
  setRoom((prev) => (prev ? { ...prev, players } : prev));
});
```

**REST polling 繼續保留**（fallback，處理 channel 未連線的情況）。

## 測試要求（TDD）

### `src/app/rooms/[roomId]/page.test.tsx`（已存在）

新增測試：
1. 收到 `player_joined` event 後，玩家列表更新為 payload 的 players
2. 收到 `player_left` event 後，玩家列表更新為 payload 的 players（較少人）

先讓測試 fail，再實作，確認 pass。

## 驗收條件

- [ ] `WerewolfChannelEvent` 包含 `player_joined` / `player_left`
- [ ] Payload 型別定義正確
- [ ] 等待室收到 event 後即時更新玩家列表
- [ ] REST polling 仍然保留
- [ ] 測試全數通過
- [ ] `npm run build` 通過

## Commit

```
feat(waiting-room): 監聽 player_joined / player_left channel events 即時更新玩家列表
```
