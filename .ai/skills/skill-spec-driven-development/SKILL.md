---
name: skill-spec-driven-development
description: Use before implementing any new feature — ensures development follows spec/ design files and Elixir backend contracts before writing any code
---

# 規格驅動開發（Spec-Driven Development）

受 [GitHub spec-kit](https://github.com/github/spec-kit) 啟發的工作流，確保實作前先對齊設計稿與後端契約。

## 何時使用

- 實作新頁面或功能前
- 修改現有 UI 元件以符合設計時
- 整合後端 API 或 Channel 事件前

## 六階段流程

### 1. Constitution（憲章）
確認專案 DNA 已在 CLAUDE.md 和 `.ai/context/tech-stack.md` 記錄：
- 技術棧版本（Next.js 15、React 19、Tailwind CSS 4）
- 設計系統（`docs/design-tokens.md`、`docs/style-guide.md`）
- 後端契約位置（Elixir specs）

### 2. Specify（規格化）
從以下來源提取規格：
- **設計稿**：`spec/` 資料夾的 PNG 截圖
- **後端契約**：`/Users/d9niel/_projects/cluiche-bord-elixir/specs/001-werewolf-engine/contracts/`
  - `rest-api.openapi.yaml`
  - `werewolf-channel.asyncapi.yaml`
- 記錄：哪些 UI 狀態、哪些 API 端點、哪些 Channel 事件

### 3. Clarify（澄清）
- 設計稿中不清楚的部分？記錄在 `tasks/report.md` §5
- 後端契約有歧義？記錄並繼續（用 mock 資料先開發）
- 不要因不確定性而停頓——記錄並繼續

### 4. Plan（規劃）
- 使用 `skill-writing-plans` 產出實作計畫
- 計畫必須包含：元件清單、API 呼叫、Channel 事件、測試策略

### 5. Tasks（任務化）
- 把計畫拆分為具體 task，記錄於 `tasks/` 資料夾
- 每個 task：明確的 acceptance criteria、可測試的條件

### 6. Implement（實作）
- 遵循 TDD：先寫測試（見 `skill-test-driven-development`）
- 每個元件對齊 Design Tokens（不寫 hardcoded 顏色）
- 實作完成後用 `skill-verification-before-completion` 驗證

## Checklist

在開始任何新功能前確認：

- [ ] 已讀取對應的 `spec/*.png` 設計稿
- [ ] 已確認需要呼叫的 API 端點（`rest-api.openapi.yaml`）
- [ ] 已確認需要訂閱的 Channel 事件（`werewolf-channel.asyncapi.yaml`）
- [ ] 規格不明確處已記錄於 `tasks/report.md`
- [ ] 實作計畫已產出（元件、API、測試）
- [ ] 測試先於實作撰寫（TDD）
