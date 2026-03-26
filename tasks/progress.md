# Tickets Progress (release/v0.1.0)

**Base branch:** `release/v0.1.0` (commit 4e376ee)
**Worktrees:** `.worktree/<ticket-id>` → branch `codex/<ticket-id>`
**Flow:** Subagent implements in worktree with TDD → Code review → Merge to release/v0.1.0 → Update this file.

---

## Status

| Ticket | Branch / Worktree | 狀態 | 負責人 | 已合併 |
|--------|-------------------|------|--------|--------|
| A .ai/ 資料夾重組 | — | Done | main | ✓ |
| B Card ticket variant | — | Done | subagent | ✓ |
| C 文件繁體中文化 | — | Done | subagent | ✓ |
| D tasks/ 清理 + skill | — | Done | subagent | ✓ |
| todo-waiting-room 等待加入頁 UI 修正 | — | Done | subagent | ✓ |
| 05c 夜晚階段 UI | — | Done | subagent | ✓ |
| 05d 警長競選 UI | — | Done | subagent | ✓ |
| 05e 白天流程 UI | — | Done | subagent | ✓ |
| api-req fixes | — | Done | main | ✓ |
| 06b | — | Done | subagent | ✓ |
| 06c | — | Done | subagent | ✓ |
| 06a | — | Done | subagent | ✓ |
| 07a | codex/07a / .worktree/07a | In Progress | subagent | — |
| 07b | codex/07b / .worktree/07b | In Progress | subagent | — |
| 07c | codex/07c / .worktree/07c | In Progress | subagent | — |

---

## Archived (已完成並合併的 tickets)

| Ticket | 說明 | 已合併 |
|--------|------|--------|
| 00 Cleanup | 專案初始清理 | ✓ |
| 02 Design Tokens & Style Guide | 設計系統基礎 | ✓ |
| 03 Reusable Components | NotificationBanner, FixedBottomBar, SegmentedControl, Card, Modal | ✓ |
| 04a Auth & REST Client | 認證 + REST 客戶端 | ✓ |
| 04b Phoenix Channel Client | Phoenix Channel 客戶端 | ✓ |
| 04c Game State Types | 遊戲狀態型別 | ✓ |
| todo-01 Home + guard | 首頁 + 路由守衛 | ✓ |
| todo-02 Create room | 建立房間頁面 | ✓ |
| todo-03 Waiting room | 等待室頁面 | ✓ |
| todo-04 Game phases | 遊戲階段元件 | ✓ |
| 05a Channel 真實整合 | game page 連接 Phoenix Channel | ✓ |
| 05b 過場畫面 | RoleReveal/NightOpening/DayOpening/SheriffOpening | ✓ |
| 05f 勝利畫面 | VictoryPage（village/wolves win） | ✓ |

---

## Merge log

- **todo-waiting-room** → release/v0.1.0: 等待加入頁 UI 修正（Header fixed/danger title、lucide icons、Button green/red/yellow/purple variants、重新排序/變更房主改 buttons、footer 票券風格）。

- **04c** → release/v0.1.0 (fast-forward): game state types + vitest.
- **04a** → release/v0.1.0 (merge, resolved vitest.config.mjs): auth + REST client.
- **04b** → release/v0.1.0 (merge, resolved package.json): Phoenix channel client; post-merge fix: channel tests use constructor for transport, single vitest.config.mjs, removed vitest.config.ts.
- **03** → release/v0.1.0 (merge, resolved setup.ts + package.json): NotificationBanner, FixedBottomBar, SegmentedControl, Card, Modal; vitest unified (happy-dom for all tests, React plugin).
- **todo-01** → release/v0.1.0 (fast-forward): home page align spec/首頁.png, /rooms guard (即將開放).
- **todo-02** → release/v0.1.0 (fast-forward): create-room page (form + success state).
- **todo-03** → release/v0.1.0 (merge): rooms/[roomId] waiting room, getUserId in API client.
- **todo-04** → release/v0.1.0 (fast-forward): game phase components in components/pages, PhaseRouter in game page.
- **Ticket A** → release/v0.1.0: .ai/ 資料夾重組（context、skills 整理）。
- **Ticket B** → release/v0.1.0: Card 元件新增 ticket variant。
- **Ticket C** → release/v0.1.0: 文件繁體中文化（CLAUDE.md、docs/）。
- **Ticket D** → release/v0.1.0: 清理已完成 tasks/、新增 skill-spec-driven-development。

---

## Notes

- Each subagent: create worktree from `release/v0.1.0`, implement ticket with **TDD** and **.openskills** skills (e.g. skill-test-driven-development, skill-verification-before-completion).
- After completion: main agent code review → fix request or merge into `release/v0.1.0` → update this table.
