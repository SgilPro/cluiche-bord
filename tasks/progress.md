# Tickets Progress (release/v0.1.0)

**Base branch:** `release/v0.1.0` (commit 4e376ee)  
**Worktrees:** `.worktree/<ticket-id>` → branch `codex/<ticket-id>`  
**Flow:** Subagent implements in worktree with TDD → Code review → Merge to release/v0.1.0 → Update this file.

---

## Status

| Ticket | Branch / Worktree | Status | Assignee | Merged |
|--------|-------------------|--------|----------|--------|
| 00 Cleanup | — | Done | main | ✓ (already on release) |
| 02 Design Tokens & Style Guide | — | Done | main | ✓ (already on release) |
| 03 Reusable Components | codex/ticket-03 @ .worktree/ticket-03 | Done | subagent | ✓ |
| 04a Auth & REST Client | codex/ticket-04a @ .worktree/ticket-04a | Done | subagent | ✓ |
| 04b Phoenix Channel Client | codex/ticket-04b @ .worktree/ticket-04b | Done | subagent | ✓ |
| 04c Game State Types | codex/ticket-04c @ .worktree/ticket-04c | Done | subagent | ✓ |
| 04d Screens | — | Blocked (02, 03, 04b, 04c) | — | |

---

## Merge log

- **04c** → release/v0.1.0 (fast-forward): game state types + vitest.
- **04a** → release/v0.1.0 (merge, resolved vitest.config.mjs): auth + REST client.
- **04b** → release/v0.1.0 (merge, resolved package.json): Phoenix channel client; post-merge fix: channel tests use constructor for transport, single vitest.config.mjs, removed vitest.config.ts.
- **03** → release/v0.1.0 (merge, resolved setup.ts + package.json): NotificationBanner, FixedBottomBar, SegmentedControl, Card, Modal; vitest unified (happy-dom for all tests, React plugin).

---

## Notes

- Each subagent: create worktree from `release/v0.1.0`, implement ticket with **TDD** and **.openskills** skills (e.g. skill-test-driven-development, skill-verification-before-completion).
- After completion: main agent code review → fix request or merge into `release/v0.1.0` → update this table.
