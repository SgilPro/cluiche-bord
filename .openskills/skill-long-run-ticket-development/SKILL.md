---
name: long-run-ticket-development
description: Use when partner requests unsupervised long-run execution of multiple tickets—create progress tracker, assign subagents to worktrees with TDD, code review, merge to release branch, retry on failure, record blockers in report.md
---

# Long-Run Ticket Development

Execute multiple tickets in **unsupervised mode** (partner away): worktrees + subagents + TDD + merge, with retries and report for blockers.

**Core principle:** Self-driving, retry 2–3x on failure, record non-blocking issues in `tasks/report.md`.

## When to Use

- Partner says "long run", "unsupervised", "I'm going out", or similar
- Multiple tickets in `tasks/` to implement in parallel or sequence
- Need subagents to work in isolated worktrees

## The Process

### 0. Setup Progress Tracker

1. Create or update **`tasks/progress.md`**:
   - Base branch (e.g. `release/v0.1.0`)
   - Table: Ticket | Branch/Worktree | Status | Assignee | Merged
   - Merge log section
   - Notes: TDD, code review, merge flow

2. Ensure base branch exists and is checked out.

### 1. Create Worktrees

For each ticket to implement:

```bash
git fetch origin
git worktree add .worktree/<ticket-id> -b codex/<ticket-id> <base-branch>
```

- Path: `.worktree/<ticket-id>` (inside repo; add to .gitignore if needed)
- Branch: `codex/<ticket-id>`
- Base: e.g. `release/v0.1.0`

### 2. Dispatch Subagents

For each ticket, dispatch **mcp_task** (generalPurpose or shell):

**Prompt must include:**
- Worktree path: `/path/to/project/.worktree/<ticket-id>`
- Ticket file: `tasks/ticket-<id>-*.md`
- **TDD**: Write tests first, then implement
- **Skills**: Use .openskills (e.g. test-driven-development, verification-before-completion)
- **CRITICAL – commit before returning:** Subagent MUST run `git add -A && git commit -m "feat(ticket-XX): ..."` in the worktree before finishing. Without this, merge will fail.
- Return: summary, files changed, tests/build status

### 3. Verify and Code Review

When a subagent returns:

1. Run tests and build in that worktree.
2. Review key files for correctness, contract alignment, no Prisma/socket.io.
3. If issues:
   - **Retry 1–2x**: Re-invoke subagent with specific feedback (resume or new task).
   - If still failing after 2–3 retries → record in `tasks/report.md` §5.

### 4. Merge to Release Branch

1. `git checkout <release-branch>` in main repo.
2. `git merge codex/<ticket-id> -m "merge: ticket-XX ..."`.
3. Resolve conflicts (package.json, vitest config, etc.); consolidate to single config.
4. Run full test suite and build.
5. Update `tasks/progress.md` (status, merge log).
6. **Remove worktree** to avoid accumulation:
   ```bash
   git worktree remove .worktree/<ticket-id>
   git branch -D codex/<ticket-id>
   ```

### 5. Record Issues

**`tasks/report.md`** – use for:

- Non-blocking issues that need partner decision
- Items that could not be resolved after 2–3 retries
- Open questions (e.g. Next 16 upgrade, i18n strategy)

**Do NOT block on** issues that can be deferred; document and continue.

## Retry Policy

- **Merge conflicts, test failures, build errors:** Fix in main agent or re-dispatch subagent with clear feedback. Retry up to **2–3 times**.
- **Blocking decision needed:** Record in report.md, continue with other tickets if possible.

## Checklist (TodoWrite)

Create todos for:

1. [ ] Setup progress.md and worktrees
2. [ ] Dispatch subagent for ticket A
3. [ ] Code review ticket A → merge or retry
4. [ ] Dispatch subagent for ticket B
5. ... repeat per ticket
6. [ ] Update report.md with any open issues

## References

- **Worktrees:** `docs/worktrees.md` (branch prefix `codex/`)
- **Progress format:** `tasks/progress.md`
- **Report format:** `tasks/report.md` §5 (Non-blocking Issues)
- **Related skills:** executing-plans, subagent-driven-development, test-driven-development, verification-before-completion

## Summary

| Step | Action |
|------|--------|
| 0 | Create `tasks/progress.md`, ensure base branch |
| 1 | `git worktree add .worktree/<ticket> -b codex/<ticket> <base>` |
| 2 | mcp_task: ticket + TDD + **commit before return** |
| 3 | Verify, code review, retry 2–3x if needed |
| 4 | Merge to release, update progress, **remove worktree** (`git worktree remove`, `git branch -D`) |
| 5 | Record blockers in `tasks/report.md` |
