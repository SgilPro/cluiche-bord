# Worktree 工作流程

本專案每個 agent 使用一個獨立的 worktree，以避免衝突並隔離各自的變更。

## 命名慣例

- 分支前綴：`codex/`
- 每個分支只處理一個主題
- 避免長時間保留 worktree（完成後即刪除）

## 建立 Worktree

```bash
git fetch origin
git worktree add ../cluiche-bord-<agent> -b codex/<agent>/<topic>
```

範例：
```bash
git worktree add ../cluiche-bord-agent-a -b codex/agent-a/seat-dnd
```

或使用 `.worktree/` 子目錄（本專案慣例）：
```bash
git worktree add .worktree/<ticket> -b codex/<ticket>
```

## 切換 / 更新

```bash
cd ../cluiche-bord-<agent>
git status -sb
git pull --rebase origin main
```

## 刪除 Worktree

```bash
cd /Users/d9niel/_projects/cluiche-bord
git worktree remove ../cluiche-bord-<agent>
git branch -D codex/<agent>/<topic>
```

## 注意事項

- 保持 `main` 乾淨，僅用於整合。
- 開 PR 前先從 `origin/main` rebase。
- 修改共用檔案（如 layout、design tokens）時，請與其他 agent 協調。
- 功能完成後，將分支 merge 到 `release/v0.1.0`，再 PR 到 `main`。
