# Ticket 06b — start_game 移除 hardcode config

## 目標

後端已確認 `start_game` 可省略 `config`，只傳 `{ "player_ids": [...] }` 即可。
移除前端 `handleStartGame` 中的 hardcode Basic10 config。

## 範圍

單一檔案修改：`src/app/rooms/[roomId]/page.tsx`

## 修改說明

找到 `handleStartGame` 函式（約 140 行），將：

```ts
const basic10Config = { ... };
await ch.push("start_game", {
  config: basic10Config,
  player_ids: room.players.map((p) => p.user_id),
});
```

改為：

```ts
await ch.push("start_game", {
  player_ids: room.players.map((p) => p.user_id),
});
```

刪除 `basic10Config` 變數定義及 TODO 註解。

## 測試要求（TDD）

檔案：`src/app/rooms/[roomId]/page.test.tsx`（已存在）

1. 先執行現有測試，確認通過
2. 新增測試：`handleStartGame` push 的 payload 不含 `config` 欄位，只含 `player_ids`
3. 實作修改，讓測試通過

## 驗收條件

- [ ] `start_game` push payload 不含 `config`
- [ ] 相關測試通過
- [ ] `npm run build` 通過
- [ ] `npm test` 全數通過

## Commit 格式

```
feat(waiting-room): start_game 改為只傳 player_ids（移除 hardcode config）
```
