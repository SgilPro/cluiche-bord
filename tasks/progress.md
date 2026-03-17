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
| 03 Reusable Components | codex/ticket-03 @ .worktree/ticket-03 | In progress | subagent | |
| 04a Auth & REST Client | codex/ticket-04a @ .worktree/ticket-04a | In progress | subagent | |
| 04b Phoenix Channel Client | codex/ticket-04b @ .worktree/ticket-04b | In progress | subagent | |
| 04c Game State Types | codex/ticket-04c @ .worktree/ticket-04c | In progress | subagent | |
| 04d Screens | — | Blocked (02, 03, 04b, 04c) | — | |

---

## Merge log

- (none yet; first merge will be recorded here after code review)

---

## Notes

- Each subagent: create worktree from `release/v0.1.0`, implement ticket with **TDD** and **.openskills** skills (e.g. skill-test-driven-development, skill-verification-before-completion).
- After completion: main agent code review → fix request or merge into `release/v0.1.0` → update this table.
