# API Requirements（前端需要後端補充的內容）

## 優先級說明
- 🔴 **阻塞**：前端目前無法正常運作，需要後端先補
- 🟡 **重要**：功能不完整，但有前端 workaround
- 🟢 **可延後**：目前有暫時方案，之後再補

---

## 1. ✅ `GameState.Player` 缺少 `nickname`

**已解決**：AsyncAPI spec 的 `Player` schema 已包含 `nickname: string (nullable)`。

**前端已完成**：
- ✅ `src/lib/channel/types.ts` 的 `ChannelPlayer` interface 加入 `nickname?: string | null`
- ✅ `src/lib/games/werewolf/types.ts` 的 `Player` 加入 `nickname?: string`
- ✅ 各遊戲 UI 元件改用 `nickname ?? 座位號`（DayAnnounceDeathsPage、DaySpeechPage、LastWordPage、VictoryPage、PlayerCardGrid）

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

**前端已完成**：
- ✅ `SubPhase` 型別加入 `role_reveal` / `night_opening`（werewolf/types.ts + channel/types.ts）
- ✅ 移除 `seenFirstNightRef` timer workaround；改由 `state.sub_phase` 直接驅動 RoleRevealScreen / NightOpeningScreen
- （`timer_ends_at` 驅動倒數待後續優化）

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

## 7. 🟡 `vote_tie` / `vote_no_exile` event 前端處理

**狀態**：基本處理已完成。

- `vote_tie`：放逐投票平票，進入 `exile_tie_speech` → `exile_tie_vote` 流程
- `vote_no_exile`：二次平票或無多數，本回合無人放逐

**前端已完成**：
- ✅ `WerewolfChannelEvent` 加入 `vote_tie` / `vote_no_exile`；新增 `VoteTiePayload` / `VoteNoExilePayload` 型別
- ✅ game page 監聽事件並顯示 NotificationBanner（平票提示 / 無人出局提示）
- ✅ 收到新 `state` event 時自動清除通知

**待確認**：`exile_tie_speech` / `exile_tie_vote` sub_phase 是否獨立存在，或重用 `speech` / `vote`？（若有獨立 sub_phase 需加入 SubPhase 型別和 PhaseRouter）。

---

## 追蹤狀態

| # | 需求 | 優先級 | 後端狀態 | 前端方案 |
|---|------|--------|---------|---------|
| 1 | Player.nickname | ✅ | 已完成 | ✅ 前端已完成 |
| 2 | start_game 省略 config | 🔴 | spec 未更新，待確認 | hardcode Basic10 |
| 3 | role_reveal / night_opening sub_phase | ✅ | 已完成 | ✅ 前端已完成 |
| 4 | timer_ends_at 保證有值 | 🟢 | 待確認 | 可選顯示 |
| 5 | role_action_result push 設計確認 | ✅ | 已確認 | ✅ |
| 6 | 等待室玩家加入 channel event | 🟡 | 無 event | REST polling workaround |
| 7 | vote_tie / vote_no_exile 前端處理 | 🟡 | 已有 event | ✅ 基本處理完成 |
