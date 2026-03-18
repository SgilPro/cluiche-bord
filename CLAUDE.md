# Cluiche Bord — Claude Code 指引

## 專案概述

線上桌遊平台（純前端 Next.js 15），後端為 Elixir（REST + Phoenix Channel）。
目前實作狼人殺遊戲。分支：`release/v0.1.0`（開發主分支）。

## AI 指令集中管理

所有 AI 指令的 **source of truth** 在 `.ai/` 資料夾：

```
.ai/
├── skills/      ← AI 技能 (.openskills 是這裡的 symlink)
├── rules/       ← 專案規則 (.cursor/rules 是 symlink)
├── context/     ← 專案背景 (.cursor/context 是 symlink)
└── commands/    ← 常用指令 (.cursor/commands 是 symlink)
```

## Skills 系統

@.ai/skills/skill-using-superpowers/SKILL.md

## 關鍵規則

@.ai/rules/architecture.md
@.ai/rules/code-style.md

## 技術棧（快速參考）

- **框架**：Next.js 15.3.2（App Router，純前端）
- **語言**：TypeScript 5 strict + React 19
- **樣式**：Tailwind CSS 4 + CSS 自訂屬性（Design Tokens）
- **測試**：Vitest 4 + @testing-library/react + happy-dom
- **後端**：Elixir REST API + Phoenix Channel（WebSocket）
- **圖示**：lucide-react
- **詳細**：@.ai/context/tech-stack.md

## 進度追蹤

- 任務進度：`tasks/progress.md`
- 問題記錄：`tasks/report.md`
- 設計稿：`spec/` 資料夾（PNG）
- 設計系統：`docs/design-tokens.md`、`docs/style-guide.md`
