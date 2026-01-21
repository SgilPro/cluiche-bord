# Cursor Agent 設定說明

本目錄包含 Cursor Agent 的設定、規則、命令和共享上下文文件。

## 目錄結構

```
.cursor/
├── commands/          # 自訂命令
├── rules/            # 詳細規則
├── plans/            # 任務計畫（由 Agent 自動建立）
├── context/          # 共享上下文文件
├── task-management.md # 任務管理機制說明
└── README.md         # 本文件
```

## 快速開始

### 使用 Plan Mode
1. 在 Agent 輸入框按下 `Shift + Tab`
2. 描述你的需求
3. Agent 會建立詳細計畫
4. 檢閱並調整計畫
5. 點擊「Save to workspace」儲存計畫
6. 核准後開始執行

### 使用自訂命令
在 Agent 聊天框輸入 `/` 即可看到可用命令：
- `/review` - 程式碼審查
- `/test-fix` - 測試與修復
- `/feature-setup` - 新功能設定
- `/refactor` - 重構程式碼
- `/debug` - 除錯模式
- `/migration` - 資料庫 migration

### 使用共享上下文
使用 `@` 符號引用檔案或過去的對話：
- `@file` - 引用特定檔案
- `@code` - 引用特定程式碼區塊
- `@Past Chats` - 引用過去的對話

## 詳細說明

### Commands（命令）
位於 `.cursor/commands/`，包含可重複使用的工作流程。

### Rules（規則）
位於 `.cursor/rules/`，包含詳細的開發規範：
- `code-style.md` - 程式碼風格規範
- `architecture.md` - 架構規範
- `api-design.md` - API 設計規範

### Context（上下文）
位於 `.cursor/context/`，包含專案相關資訊：
- `project-overview.md` - 專案概覽
- `tech-stack.md` - 技術堆疊說明
- `current-state.md` - 專案當前狀態

### Plans（計畫）
位於 `.cursor/plans/`，由 Agent 在 Plan Mode 下自動建立。建議：
- 為每個重要功能建立計畫
- 定期檢閱和更新計畫
- 將完成的計畫作為文件保存

## 任務管理

詳細說明請參考 `task-management.md`。

## 最佳實踐

1. **從規劃開始**：使用 Plan Mode 建立詳細計畫
2. **明確目標**：提供具體、可驗證的目標
3. **善用 Checkpoints**：定期建立檢查點，方便還原
4. **程式碼審查**：完成後使用 `/review` 審查程式碼
5. **測試優先**：確保新功能有對應的測試

## 參考資源

- [Cursor Agent 最佳實務](https://cursor.com/zh-Hant/blog/agent-best-practices)
- [Cursor 文件](https://docs.cursor.com)
- 專案規則：`.cursorrules`
- 專案規劃：`docs/plan.md`
