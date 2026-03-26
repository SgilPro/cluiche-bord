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

## 2. ✅ `start_game` channel push 可省略 config

**已確認**：後端已實作，只需傳 `{ "player_ids": [...] }`，後端自動從 `room.variant_id` 推導 config。

**前端待完成**：移除 hardcode Basic10 workaround，改為只傳 `player_ids`。

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

**狀態**：基本處理完成，`exile_tie_speech` / `exile_tie_vote` UI 待實作。

- `vote_tie`：放逐投票平票 → broadcast `vote_tie`（含 candidates）→ `exile_tie_speech`（候選人輪流發言）→ `exile_tie_vote`（只有非候選人能投票）
- `vote_no_exile`：二次平票，本回合無人放逐

**前端已完成**：
- ✅ `WerewolfChannelEvent` 加入 `vote_tie` / `vote_no_exile`；新增 `VoteTiePayload` / `VoteNoExilePayload` 型別
- ✅ game page 監聽事件並顯示 NotificationBanner（平票提示 / 無人出局提示）
- ✅ 收到新 `state` event 時自動清除通知

**已確認**：`exile_tie_speech` / `exile_tie_vote` 是獨立 sub_phase。

**前端待完成**（新 ticket 06a）：
- 加入 `exile_tie_speech` / `exile_tie_vote` 到 SubPhase 型別
- `exile_tie_speech`：顯示當前發言者（`state.exile_tie_speech_current_id`）
- `exile_tie_vote`：候選人不能投票（`available_actions` 會反映，UI 灰化）
- PhaseRouter 加入新 sub_phase routing

---

## 追蹤狀態

| # | 需求 | 優先級 | 後端狀態 | 前端方案 |
|---|------|--------|---------|---------|
| 1 | Player.nickname | ✅ | 已完成 | ✅ 前端已完成 |
| 2 | start_game 省略 config | ✅ | 已完成 | 待前端移除 hardcode |
| 3 | role_reveal / night_opening sub_phase | ✅ | 已完成 | ✅ 前端已完成 |
| 4 | timer_ends_at 保證有值 | 🟢 | 待確認 | 可選顯示 |
| 5 | role_action_result push 設計確認 | ✅ | 已確認 | ✅ |
| 6 | 等待室玩家加入 channel event | 🟡 | 無 event | REST polling workaround |
| 7 | vote_tie / vote_no_exile 前端處理 | 🟡 | exile_tie_speech/vote 已確認 | 待 ticket 06a 實作 |
