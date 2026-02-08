# Worktrees Workflow

This repo uses one worktree per agent to avoid conflicts and keep changes isolated.

## Conventions
- Branch prefix: `codex/`
- One topic per branch
- Avoid long-lived worktrees

## Create a Worktree
```bash
git fetch origin
git worktree add ../cluiche-bord-<agent> -b codex/<agent>/<topic>
```

Example:
```bash
git worktree add ../cluiche-bord-agent-a -b codex/agent-a/seat-dnd
```

## Switch / Update
```bash
cd ../cluiche-bord-<agent>
git status -sb
git pull --rebase origin main
```

## Remove a Worktree
```bash
cd /Users/d9niel/_projects/cluiche-bord
git worktree remove ../cluiche-bord-<agent>
git branch -D codex/<agent>/<topic>
```

## Notes
- Keep `main` clean for integration.
- Rebase from `origin/main` before opening a PR.
- Coordinate when modifying shared files like `socket-server.ts`.
