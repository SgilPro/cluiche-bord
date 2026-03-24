# 遊戲階段實作計劃

## 畫面清單

以下為所有需要實作的遊戲畫面，按出現順序排列。

| ID  | 畫面元件                    | 觸發時機                        | 誰看到         | 狀態   |
|-----|----------------------------|---------------------------------|---------------|--------|
| S0  | `RoleRevealScreen`         | 遊戲開始後（state 首次到達）      | 所有人（各自） | ⬜ 新增 |
| S1  | `NightOpeningScreen`       | 進入 night phase 時             | 所有人         | ⬜ 新增 |
| S2a | `NightWolvesWaitPage`      | night/wolves，非狼人             | 非狼人         | ⬜ 重構 |
| S2b | `NightWolvesActivePage`    | night/wolves，狼人               | 狼人           | ⬜ 重構 |
| S3a | `NightWitchWaitPage`       | night/witch，非女巫              | 非女巫         | ⬜ 重構 |
| S3b | `NightWitchActivePage`     | night/witch，女巫                | 女巫           | ⬜ 重構 |
| S4a | `NightSeerWaitPage`        | night/seer，非預言家             | 非預言家       | ⬜ 重構 |
| S4b | `NightSeerActivePage`      | night/seer，預言家               | 預言家         | ⬜ 重構 |
| S5a | `NightHunterCheckWaitPage` | night/hunter_check，非獵人       | 非獵人         | ⬜ 重構 |
| S5b | `NightHunterCheckActivePage`| night/hunter_check，獵人        | 獵人           | ⬜ 重構 |
| S6  | `DayOpeningScreen`         | 進入 day/announce_deaths 時      | 所有人         | ⬜ 新增 |
| S7  | `DayAnnounceDeathsPage`    | day/announce_deaths             | 所有人         | ⬜ 重構 |
| S8  | `SheriffOpeningScreen`     | 進入 day/sheriff_run 時          | 所有人         | ⬜ 新增 |
| S9  | `SheriffRunPage`           | day/sheriff_run                 | 所有人         | ⬜ 重構 |
| S10 | `SheriffSpeechPage`        | day/sheriff_speech, tie_speech  | 所有人         | ⬜ 重構 |
| S11 | `SheriffFinalWithdrawPage` | day/sheriff_final_withdraw      | 所有人         | ⬜ 重構 |
| S12 | `SheriffVotePage`          | day/sheriff_vote, tie_vote      | 所有人         | ⬜ 重構 |
| S13 | `LastWordPage`             | day/last_word                   | 所有人         | ⬜ 新增 |
| S14 | `DaySpeechPage`            | day/speech                      | 所有人         | ⬜ 重構 |
| S15 | `DayVotePage`              | day/vote                        | 所有人         | ⬜ 重構 |
| S16 | `HunterShootPage`          | day/hunter_shoot                | 所有人/獵人    | ⬜ 重構 |
| S17 | `SheriffHandoverPage`      | day/sheriff_handover            | 所有人/警長    | ⬜ 新增 |
| S18 | `VictoryPage`              | channel `victory` 事件          | 所有人         | ⬜ 新增 |

---

## Transition 流程

```
start_game (channel push)
  ↓ 後端廣播 state event（players 有 role）
  ↓
[S0] RoleRevealScreen — 各玩家看自己角色，倒數 or 按確認
  ↓ phase_change: night/wolves
  ↓
[S1] NightOpeningScreen — 「天黑請閉眼」深色全螢幕，~10s
  ↓ timer 到期 or 收到下一個 sub_phase state
  ↓
[S2a/S2b] wolves — 狼人選落刀（timer，全鎖定後推進）
  ↓ phase_change: night/witch
[S3a/S3b] witch — 女巫用解藥/毒藥/跳過
  ↓ phase_change: night/seer
[S4a/S4b] seer — 預言家查驗
  ↓ phase_change: night/hunter_check
[S5a/S5b] hunter_check — 獵人確認
  ↓
  ├─ day 1 且 config.sheriff → phase_change: day/sheriff_run
  │    ↓
  │   [S8] SheriffOpeningScreen — 「上警環節」橙色全螢幕
  │    ↓
  │   [S9] SheriffRunPage → [S10] SheriffSpeechPage
  │    → [S11] SheriffFinalWithdrawPage → [S12] SheriffVotePage
  │    → （可能 tie: tie_speech → tie_vote）
  │    ↓ 警長選出 or 無人上警
  │
  └─ announce_deaths (所有路徑最終都到這裡)
       ↓
      [S6] DayOpeningScreen — 「天亮請睜眼」亮色全螢幕
       ↓
      [S7] DayAnnounceDeathsPage — 公告夜間死亡
       ↓
       ├─ 有死亡 → 勝負判斷（後端處理）
       │    → 若勝負決定: [S18] VictoryPage
       │    → 若有獵人夜間死亡: [S16] HunterShootPage → [S13] LastWordPage → ...
       │    → 否則: [S13] LastWordPage
       └─ 無死亡 → [S14] DaySpeechPage
            ↓
           [S15] DayVotePage — 放逐投票（timer）
            ↓
            ├─ 無放逐 → 進入下一夜 [S1] NightOpeningScreen
            ├─ 平票 → exile_tie_speech → exile_tie_vote
            └─ 有放逐 → 勝負判斷
                 → 若獵人被放逐: [S16] HunterShootPage
                 → [S17] SheriffHandoverPage（警長被放逐且有繼承）
                 → [S13] LastWordPage
                 → 進入下一夜 [S1] NightOpeningScreen
                 → 若勝負決定: [S18] VictoryPage
```

---

## 需要新增的共用 UI 元件

| 元件                 | 用途                                      |
|---------------------|------------------------------------------|
| `PlayerCardGrid`    | 3欄玩家卡片格 (用於狼人/女巫/預言家/投票) |
| `PhaseTimer`        | 大數字倒數計時器（timer_ends_at）          |
| `PhaseOpeningScreen`| 全螢幕過場畫面（天黑/天亮/上警，傳入顏色） |
| `ActionFooter`      | 底部三按鈕列（結束回合/取消/確認行動）     |

---

## Ticket 清單

### Ticket 05a｜game page → Channel 真實整合
**目標**：移除 mock state，連接真實 Phoenix Channel，state 驅動所有頁面

- [ ] `/game/[roomId]/page.tsx` 連接 Phoenix Channel（參考 waiting room 做法）
- [ ] 監聽 `state` event → 更新 GameState
- [ ] 監聽 `victory` event → 顯示 VictoryPage
- [ ] 將 `pushAction(event, payload)` callback 透過 PhaseRouter 傳遞給各頁面
- [ ] PhaseRouter 增加 `onAction` prop，各 page 用它發送 channel push

### Ticket 05b｜前端過場畫面（新增）
**目標**：S0 角色揭示、S1 天黑、S6 天亮、S8 上警環節 四個過場

- [ ] 新增 `PhaseOpeningScreen` 共用元件（全螢幕，接受 bg color、標題、副標）
- [ ] `RoleRevealScreen`：顯示自己角色（wolf/seer/witch/hunter/villager），圖示＋說明，倒數 5s 或按確認
- [ ] `NightOpeningScreen`：深紫背景「天黑請閉眼」，~10s 後自動推進（對齊 spec `夜晚階段-大概停留10s.png`）
- [ ] `DayOpeningScreen`：淺藍背景「天亮請睜眼」，~10s（對齊 spec `白天階段-大概停留10s.png`）
- [ ] `SheriffOpeningScreen`：橙色背景「上警環節」（對齊 spec `白天階段-上警環節.png`）
- [ ] 過場觸發邏輯：在 game page 監聽 phase_change，插入過場畫面後再切換 sub_phase UI

### Ticket 05c｜夜晚階段 UI
**目標**：wolves/witch/seer/hunter_check 的真實互動 UI

- [ ] 新增 `PlayerCardGrid` 元件：3欄、座位號、頭像（公開 avatar）、名稱、選取狀態（橙/紅框）
- [ ] 新增 `PhaseTimer` 元件：大數字顯示，從 timer_ends_at 倒數
- [ ] 新增 `ActionFooter` 元件：3按鈕（結束回合 | 取消選擇 | 確認行動）
- [ ] `NightWolvesPage` 拆成 Active（狼人視角：PlayerCardGrid + timer + wolf_votes 顯示同伴投票）/ Wait（非狼人：暗紅全螢幕）
- [ ] `NightWitchPage` 拆成 Active（道具選擇卡片 + PlayerCardGrid）/ Wait（暗紅全螢幕）
- [ ] `NightSeerPage` 拆成 Active（PlayerCardGrid 選查驗目標，確認後顯示陣營結果）/ Wait（暗紅全螢幕）
- [ ] `NightHunterCheckPage` 拆成 Active（「我是獵人，知曉即可」按確認）/ Wait（暗紅全螢幕）

### Ticket 05d｜警長競選 UI
**目標**：sheriff_run → speech → final_withdraw → vote 完整流程

- [ ] `SheriffRunPage`：玩家列表可點「舉手上警」，房主可強制推進
- [ ] `SheriffSpeechPage`：目前誰在發言（高亮），發言順序列表，房主可強制推進（同時處理 tie_speech）
- [ ] `SheriffFinalWithdrawPage`：候選人可點退水，房主可強制推進
- [ ] `SheriffVotePage`：投票選警長，PlayerCardGrid（只顯示候選人），同時處理 tie_vote

### Ticket 05e｜白天流程 UI
**目標**：announce_deaths / last_word / speech / vote / hunter_shoot / sheriff_handover

- [ ] `DayAnnounceDeathsPage`：列出死亡玩家＋死因（wolf/poison），無死亡時顯示「平安夜」
- [ ] `LastWordPage`（新增）：顯示目前發遺言的玩家，等待後端推進（state.last_word_current_id）
- [ ] `DaySpeechPage`：發言順序列表，highlight 目前發言者（state 驅動），房主可強制推進
- [ ] `DayVotePage`：PlayerCardGrid（存活玩家），投票後高亮已選，timer，房主強制推進
- [ ] `HunterShootPage`：獵人視角顯示 PlayerCardGrid 選目標；非獵人顯示等待畫面
- [ ] `SheriffHandoverPage`（新增）：警長視角選繼承人；非警長顯示等待畫面

### Ticket 05f｜勝利畫面
**目標**：village win / wolves win，顯示所有玩家角色揭示

- [ ] `VictoryPage`（新增）：顯示勝利陣營、所有玩家角色揭示列表，「返回大廳」按鈕

---

## 執行順序建議

```
05a（Channel 整合）→ 05b（過場）→ 05c（夜晚）→ 05d（警長）→ 05e（白天）→ 05f（勝利）
```

05a 是基礎，其他 tickets 都依賴它。05c/05d/05e 可以在 05b 完成後並行。

---

## 待確認事項（review 時討論）

1. **過場時機**：過場畫面（天黑/天亮）是由前端 timer 自動推進，還是等後端 phase_change 才換頁？建議：前端倒數 ~10s，不等後端，但若收到新的 sub_phase state 就直接切換。
2. **RoleReveal 資料來源**：state.players[me].role，但 game page 需要知道「我的 player_id」來找自己的角色（從 localStorage getUserId 對比）。
3. **PlayerCardGrid 暱稱來源**：GameState.players 只有 `id`（不是 nickname），需要確認後端 state 是否會帶名稱，或是需要從 waiting room 傳入 nickname mapping。目前 types.ts 的 Player 只有 `id`、`alive`、`role`、`seat_index`。**這是較大的缺口，記錄於 report.md。**
4. **avatar 顯示**：遊戲中玩家卡片要顯示頭像，需要知道每位玩家選的 avatar，但 state 沒有此欄位。是否用 seat_index 固定對應 avatar？
5. **非狼人暗畫面**：非狼人在夜晚各階段看到的畫面是「全暗 + 說明文字」，不需要 push 任何 action，應顯示倒數 or 等待動畫。
