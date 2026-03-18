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
| 04d Screens 後端整合 | — | Pending | — | |

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

---

## Merge log

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
