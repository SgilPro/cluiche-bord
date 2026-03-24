# API Requirements（前端需要後端補充的內容）

## 優先級說明
- 🔴 **阻塞**：前端目前無法正常運作，需要後端先補
- 🟡 **重要**：功能不完整，但有前端 workaround
- 🟢 **可延後**：目前有暫時方案，之後再補

---

## 1. ✅ `GameState.Player` 缺少 `nickname`

**已解決**：AsyncAPI spec 的 `Player` schema 已包含 `nickname: string (nullable)`。

**前端待做**：
- 更新 `src/lib/channel/types.ts` 的 `ChannelPlayer` interface 加入 `nickname: string | null`
- 更新 `src/lib/games/werewolf/types.ts` 的對應型別
- 移除各遊戲 UI 元件中的 `座位 ${seat_index + 1}` fallback，改用 `nickname ?? 座位號`

---

## 2. 🔴 `start_game` channel push 需要改成由後端從 variant 推導 config

**問題**：目前 `start_game` channel contract 要求前端傳入完整 `config`（roles、rules、timer 秒數），但這些資料存在 room 的 `variant_id` 裡，前端重複建構會造成雙重維護問題。

**目前 spec 狀態**：`StartGameRequest` 的 `required` 仍包含 `config`，與後端宣稱已完成有出入，**需確認 spec 是否有更新**。

**需要後端補充**：`start_game` 可接受省略 `config`，後端從 room 的 `variant_id` 自動推導：
```json
// 理想的前端 payload
{
  "player_ids": ["p1", "p2", ...]
}
// 後端從 room.variant_id → game_variant → config
```

**前端 workaround**：暫時 hardcode Basic10 預設 config（`sheriff: true, massacre: false`，roles 固定 10 人配置）。

---

## 3. ✅ `role_reveal` / `night_opening` sub_phase 已加入

**已解決**：AsyncAPI spec 的 sub_phase enum 已包含 `role_reveal` 和 `night_opening`。

**前端待做**：
- 移除前端自行插入過場的 timer workaround（game/[roomId]/page.tsx 的 `seenFirstNightRef` 邏輯）
- 改為監聽 `phase_change` 或 `state` event 的 `sub_phase === "role_reveal"` / `"night_opening"` 來顯示對應畫面
- `timer_ends_at` 驅動倒數（若無 timer 則固定顯示後靠 `advance` 推進）

---

## 4. 🟢 `timer_ends_at` 應對所有有計時的 sub_phase 都帶值

**問題**：`timer_ends_at` 在 GameState 裡是 `nullable`，但前端需要它來顯示倒數計時。

**需要後端確認**：以下 sub_phase 的 `timer_ends_at` 一定會有值（非 null/undefined）：
- `wolves`（wolf vote timer）
- `sheriff_vote` / `sheriff_tie_vote`
- `vote`（exile vote timer）
- `sheriff_run`（可選，房主可強制推進）
- `speech`、`sheriff_speech`（發言計時，依 config）

若某 sub_phase 沒有 timer，`timer_ends_at` 可以 `null` 或省略，前端不顯示倒數。

---

## 5. ✅ `role_action_result` push 設計確認

**已確認**：push to specific user（預言家），其他人不會收到，設計正確。

---

## 6. 🟡 等待室（waiting room）玩家加入無 channel event

**問題**：Channel 的 server→client event 清單（`state`, `phase_change`, `sheriff_elected`, `death_announcement`, `victory`, `role_action_result`, `vote_tie`, `vote_no_exile`）中沒有玩家加入通知。等待室無法即時更新玩家列表。

**選項 A（前端 workaround）**：等待室 REST polling（每 3 秒 `GET /rooms/{id}`），偵測到 `game_status === "playing"` 時停止。
**選項 B（後端補充）**：加入 `player_joined` / `room_updated` channel event，broadcast 給房間所有成員。

**目前做法**：採 A，待後端確認是否要加 event。

---

## 7. 🟡 `vote_tie` / `vote_no_exile` event 前端尚未處理

**問題**：spec 新增了這兩個 event，前端目前沒有對應處理。

- `vote_tie`：放逐投票平票，進入 `exile_tie_speech` → `exile_tie_vote` 流程
- `vote_no_exile`：二次平票或無多數，本回合無人放逐

**前端待做**：在 PhaseRouter / game page 加入對這兩個 event 的處理（顯示提示或自動切換 UI）。

---

## 追蹤狀態

| # | 需求 | 優先級 | 後端狀態 | 前端方案 |
|---|------|--------|---------|---------|
| 1 | Player.nickname | ✅ | 已完成 | 前端型別 + UI 待更新 |
| 2 | start_game 省略 config | 🔴 | spec 未更新，待確認 | hardcode Basic10 |
| 3 | role_reveal / night_opening sub_phase | ✅ | 已完成 | 前端 workaround 待移除 |
| 4 | timer_ends_at 保證有值 | 🟢 | 待確認 | 可選顯示 |
| 5 | role_action_result push 設計確認 | ✅ | 已確認 | ✅ |
| 6 | 等待室玩家加入 channel event | 🟡 | 無 event | REST polling workaround |
| 7 | vote_tie / vote_no_exile 前端處理 | 🟡 | 已有 event | 前端待實作 |
