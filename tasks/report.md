# Cluiche Bord 改寫進度報告

**最後更新：** （自動）
**模式：** 無人監督長時間執行。非阻塞性問題與待決定事項記錄於此。

---

## 0. 清理（目前分支）

**狀態：** 完成。

**範圍：**
- 移除 Prisma（schema、migrations、generated client、`src/lib/db`、`src/app/api/*`、`src/generated/prisma`）。
- 移除 socket-server（Node）：`socket-server.ts`、`socket-server.js`、`src/lib/socket.ts`、socket 相關 UI。
- 移除 `src/` 下依賴 Prisma 或 socket-server 的舊版全端程式碼；僅保留純前端 App Router 所需內容（後端由 Elixir 提供 REST + Channel）。
- Next.js：15.3.2（有 16 時再升級）。此專案無 rooms/games 的 API routes（那些在 Elixir）。

**已完成：**
- [x] 刪除 `prisma/`、`src/generated/`、`src/lib/db/`、`src/app/api/`。
- [x] 刪除 `socket-server.ts`、`socket-server.js`；移除 `socket-server` script；刪除 `scripts/test-db-connection.ts`。
- [x] 從 `package.json` 移除 `@prisma/client`、`prisma`、`socket.io`、`socket.io-client`、`qrcode.react`、`simple-peer`、`@types/simple-peer`。
- [x] 以 stub 替換 `src/app/page.tsx`、`src/app/rooms/page.tsx`、`src/app/game/[roomId]/page.tsx`；移除 `GameChat`、`Chat`、`src/lib/socket.ts`、`src/lib/games/werewolf/engine.ts`。
- [x] 保留：`next.config.ts`、`tsconfig.json`、`postcss.config.mjs`、`tailwind`、`layout.tsx`、`globals.css`、`src/lib/games/werewolf/types.ts`（供 Ticket 04c 對齊使用）。

**建置：** `npm run build` 通過。

**非阻塞：** Next.js 對 metadata 中的 `viewport` 有警告——建議改為獨立的 `viewport` export（見 Next.js 文件）。已記錄於 §5。

---

## 1. .openskills / Superpower (prpm)

**狀態：** 已審閱。

**位置：** `.openskills/`（透過 prpm 安裝的 skills）。

**此次改寫的相關 skills：**
- **skill-using-superpowers** – 必要：列出 skills → 若有符合者，用 Skill tool 讀取 → 宣告使用 → 遵循 skill。用於任何多步驟或清單任務。
- **skill-dispatching-parallel-agents** – 當有 3 個以上獨立工作流（如 design tokens、components、API client）可由 subagent 並行處理時使用。
- **skill-writing-plans** – 用於將設計/API/流程拆解為有序步驟。
- **skill-subagent-driven-development** – 委派給 subagent 時使用（如 explore、shell、generalPurpose）。
- **skill-executing-plans** – 有依賴關係時按順序執行 tickets。
- **skill-verification-before-completion** – 標記 ticket 完成前，驗證是否符合規格（如 Design Tokens 文件、Style Guide、contract 對齊）。

**Subagent 使用方式：**
- **主 agent：** 每個階段前列出 skills → 若「dispatching-parallel-agents」或「subagent-driven-development」適用，以明確範圍呼叫 mcp_task，並要求「回傳摘要至 report」。
- **Subagents：** 給定一個 ticket（如「從 spec/ 提取 Design Tokens」），以 readonly 或 write 模式執行；subagent 沒有 Skill tool，主 agent 會傳入精簡指令（如「依照 design-tokens ticket；輸出 tokens 至 tasks/design-tokens.md」）。
- **清單：** 當 skill 有清單時，主 agent 建立 TodoWrite todos，並在 subagent 或主 agent 完成後標記完成。

**待確認：** prpm/superpower「Skill tool」——若環境有 Skill tool 可讀取 `.openskills` 檔案，主 agent 會用於「using-superpowers」和「dispatching-parallel-agents」；若無，則從已讀取的 SKILL.md 內容套用上述方式。

---

## 2. Design Tokens & Style Guide（來自 spec/）

**狀態：** 完成（草稿）。

**交付物：**
- **Design Tokens：** `docs/design-tokens.md` — 顏色（背景、強調色、操作色、文字色）、字型、間距、border-radius；CSS 變數已加入 `src/app/globals.css`。
- **Style Guide：** `docs/style-guide.md` — 應用程式結構、按鈕、表單欄位、Header、通知橫幅、玩家列表、底部操作列、圖示、應做／不應做，以及**缺漏／未完成**（§10）：hover/focus/disabled、錯誤狀態、載入狀態、響應式、無障礙、文案、完整圖示集。

**缺口（記錄於 style-guide §10 和 design-tokens）：** 無設計工具匯出；斷點為提案但不在規格中；PNG 截圖無深色/淺色模式或無障礙資訊；文案從截圖推斷。

---

## 3. 可重用元件（來自 spec/）

**狀態：** 已開始。

**已完成：** `src/components/ui/` — `Button`（variants：primary、secondary、success、danger、segment）、`FormField`（label、選用 info icon）、`Header`（title、選用 pageTitle bar、variant default/werewolf、actionIcon）、`PlayerListItem`（seatNumber、name、isHost、isEmpty、avatarUrl）。從 `src/components/ui/index.ts` 匯出。Design tokens 已連接至 `globals.css`。

**待完成（稍後可並行）：** NotificationBanner、ActionBar/FixedBottomBar、SegmentedControl、modal/overlay。選用：將 PlayerListItem avatar 改用 `next/image`（ESLint 建議；目前使用 `<img>`）。

---

## 4. API 與流程（Elixir 後端對齊）

**狀態：** 唯讀審閱完成。前端工作 tickets 待建立。

**來源（唯讀）：**
- `/Users/d9niel/_projects/cluiche-bord-elixir/specs/001-werewolf-engine/contracts/`
  - `README.md` — 術語（game type、variant、session）、mock room `werewolf:room:mock`。
  - `rest-api.openapi.yaml` — REST：`/auth/guest`、`/rooms`、`/rooms/{id}/join` 等。
  - `werewolf-channel.asyncapi.yaml` — Channel API（state、phase_change、start_game、night_action、day_vote、sheriff_action、hunter_shoot、advance）。
  - `channel-events.md` — 人類可讀的 Channel 事件（start_game、night_action、day_vote、sheriff_action、hunter_shoot、advance；伺服器端：state、phase_change、sheriff_elected、death_announcement、victory、role_action_result）。
- `/Users/d9niel/_projects/cluiche-bord-elixir/docs/werewolf-flow.mmd` — Mermaid 流程圖：夜晚（wolves → witch → seer → hunter_check）、警長（run → speech → final_withdraw → vote，平票處理）、白天（announce_deaths、last_word、speech、vote、hunter_shoot）。

**計劃中的前端 tickets（有依賴時可並行）：**
- **Auth & REST client：** Guest 認證（POST /auth/guest）、token 儲存、房間 REST client（create、list、get、join、leave）。依賴：無。清理完成後即可開始。
- **Channel client：** Phoenix Socket JS + channel `werewolf:room:{id}` 與 `werewolf:room:mock`，join/push/listen；來自 channel-events.md / AsyncAPI 的 state、phase_change 等型別。依賴：無。
- **遊戲狀態形狀：** `state` payload 的 TypeScript 型別（phase、sub_phase、players、sheriff_id、pending_death、wolf_votes、wolf_locks、timer_ends_at 等），與 channel-events 和流程對齊。依賴：Channel client ticket（或同 ticket 完成）。
- **各階段畫面：** 每個主要階段或群組一個 ticket：如「大廳（房間列表、建立、加入、等待室）」、「夜晚（wolves、witch、seer、hunter_check）」、「警長（run、speech、final_withdraw、vote）」、「白天（announce_deaths、speech、vote、hunter_shoot）」。每個畫面消費 state 並發送正確的 Channel pushes。依賴：Design tokens + 元件（ticket 02/03）、Channel client + state 形狀。

**Tickets：** `tasks/ticket-04a-auth-rest-client.md`、`tasks/ticket-04b-channel-client.md`、`tasks/ticket-04c-game-state-types.md`、`tasks/ticket-04d-screens-*.md`（或帶子章節的單一 ticket-04-screens）。確切檔名建立任務檔時再定。

---

## 5. 非阻塞性問題與待決定事項

（經過 2–3 次反思後無法解決、需要稍後確認的事項。）

- **Next 16：** `package.json` 目前為 Next 15.3.2。若 Next 16 尚未發布或暫時維持 15，保留 15 並在 report 記錄「有 16 時再升級」。*（決定：維持 15，待你確認 16 版本；清理工作仍會移除 Prisma/socket 並為 16 做準備。）*
- **i18n：** 所有規格畫面均為中文。規格中無 i18n 策略。記錄為缺口；除非你要求，否則本次不更動。
- **E2E / Playwright：** 不在此 ticket 範圍內；可在畫面存在後作為後續 ticket。
- **Next viewport：** 建置警告「Unsupported metadata viewport is configured in metadata export」。依 Next.js 文件，改為獨立的 `viewport` export（非阻塞）。
- **ESLint：** `PlayerListItem` 的 avatar 使用 `<img>`；Next 建議改用 `next/image`。非阻塞；最佳化時再切換。
- **create-room 流程：** 建立成功頁的「進入房間」目前導向 `/game/[roomId]`。正確流程應為：建立成功 → 進入等待室 `/rooms/[roomId]` → 房主按開始遊戲後才進入 `/game/[roomId]`。若需修正，改 create-room success 的 Link 目標即可。
- **Cursor symlink 相容性**：`.cursor/rules`、`.cursor/context`、`.cursor/commands` 已建立 symlink 到 `.ai/`。若 Cursor 版本有 symlink 問題，備選方案是把內容直接留在 `.cursor/` 並加 `# Source: .ai/...` 注釋。請確認後回報。
- **CLAUDE.md @import**：`CLAUDE.md` 使用 `@path` 語法引用 `.ai/` 下的檔案。若 Claude Code 版本不支援，可改為直接 include 或 copy 內容。
- **ticket-04d 狀態**：`components/pages/` 已有所有遊戲階段元件，PhaseRouter 也已整合到 `/game/[roomId]`，但後端 Channel 整合尚未完整（目前為 mock 資料）。ticket-04d 留為「待整合後端資料」狀態。

### Ticket 05 完成後狀態（2026-03-25）

- **玩家暱稱**：✅ 已解決。後端已在 state.players 提供 `nickname`，前端型別已更新，UI 改用 `nickname ?? 座位號`。
- **avatar 缺口**：🟡 後端不提供 avatar。決定走選項 A：前端用 `user_id` hash 生成色塊 avatar，待 ticket 06c 實作。
- **過場推進時機**：✅ role_reveal / night_opening 由 state.sub_phase 驅動（後端控制）；day_opening / sheriff_opening 仍用前端 timer（~10s）。
- **vote_tie / vote_no_exile**：✅ 基本處理完成；`exile_tie_speech` / `exile_tie_vote` 已確認為獨立 sub_phase，待 ticket 06a 實作完整 UI。
- **start_game config**：✅ 後端已可省略 config，只傳 `player_ids`；待前端 ticket 06b 移除 hardcode Basic10。
- **等待室玩家加入**：✅ REST polling（3s）workaround 已實作；待後端確認是否要加 channel event（api-requirements.md #6）。

---

## 6. Ticket 索引

| ID | 標題 | 依賴 | 狀態 |
|----|------|------|------|
| 00 | 清理：移除 Prisma、API、socket-server、舊版 src | - | 完成 |
| 01 | .openskills / Superpower 使用報告 | - | 完成（本報告）|
| 02 | Design Tokens & Style Guide（來自 spec/）| - | 完成（草稿）|
| 03 | 可重用元件（來自 spec/）| 02 | 完成（已 merge）|
| 04a | Auth & REST client（guest、rooms）| 00 | 完成（已 merge）|
| 04b | Phoenix Channel client（werewolf:room）| 00 | 完成（已 merge）|
| 04c | 遊戲狀態型別（Channel state payload）| 04b | 完成（已 merge）|
| 04d | 畫面：大廳、夜晚、警長、白天（分開或合一）| 02, 03, 04b | 完成（已 merge）|
| 05a | game page → Channel 真實整合 | 04b | 完成（已 merge）|
| 05b | 前端過場畫面（RoleReveal/NightOpening/DayOpening/SheriffOpening）| 05a | 完成（已 merge）|
| 05c | 夜晚階段 UI（wolves/witch/seer/hunter_check）| 05a | 完成（已 merge）|
| 05d | 警長競選 UI（run/speech/final_withdraw/vote）| 05a | 完成（已 merge）|
| 05e | 白天流程 UI（announce_deaths/.../vote/hunter_shoot）| 05a | 完成（已 merge）|
| 05f | 勝利畫面（VictoryPage）| 05a | 完成（已 merge）|
| api-req | api-requirements.md 修正（nickname/sub_phase/vote_tie）| — | 完成 |
| 06a | exile_tie_speech / exile_tie_vote sub_phase UI | 05e | 完成（已 merge）|
| 06b | start_game 移除 hardcode config（只傳 player_ids）| 05a | 完成（已 merge）|
| 06c | Avatar 生成（user_id hash → 色塊）| 03 | 完成（已 merge）|

---

## 7. Subagent / Worktree 執行（本次 session）

- **進度：** `tasks/progress.md` 已建立；worktrees 位於 `.worktree/ticket-03`、`ticket-04a`、`ticket-04b`、`ticket-04c`（base：release/v0.1.0）。四個 subagent 以 TDD 實作 03、04a、04b、04c；主 agent 在各 worktree commit（subagent 未 commit），code review 後 merge 進 release/v0.1.0。
- **Merge 期間修正：**（1）統一 Vitest：單一 `vitest.config.mjs`，移除重複的 `vitest.config.ts` / `vitest.config.mts`；（2）Channel 測試：Phoenix Socket 使用 `new transport(url)`，故測試改用 `MockTransport` 建構子而非 factory；（3）合併 `src/test/setup.ts`（MockWebSocket + jest-dom）；（4）解決 package.json 衝突（scripts、deps）；（5）React 元件測試需要 DOM：設定 `environment: "happy-dom"` 使所有測試（包含 .tsx）通過。建置與 53 個測試均通過。
- **下次建議：** 請 subagent 在回傳前於 worktree 執行 `git add -A && git commit -m "..."`，以利後續 merge 順暢。

無阻塞性決策需要；所有問題已透過重試解決。

---

*報告將隨 subagent 完成工作及新問題發現而持續更新。*
