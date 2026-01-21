# Commit 指令

按照 Conventional Commits 格式撰寫 commit message。

## Conventional Commits 格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Type

### 主要類型

- **feat**: 新功能（feature）
- **fix**: 修復 bug
- **docs**: 文件變更
- **style**: 程式碼格式變更（不影響功能，如縮排、分號等）
- **refactor**: 重構（既不是新功能也不是修復 bug）
- **perf**: 效能優化
- **test**: 測試相關（新增或修改測試）
- **chore**: 建置流程或輔助工具的變動（如依賴更新、配置變更）
- **ci**: CI/CD 相關變更
- **build**: 建置系統或外部依賴變更
- **revert**: 回退先前的 commit

### Scope（可選）

指定變更的範圍，例如：
- `api`: API 相關
- `ui`: 使用者介面
- `db`: 資料庫
- `socket`: Socket.IO
- `auth`: 認證相關
- `game`: 遊戲邏輯

## 執行步驟

1. **檢查變更**
   - 查看 `git status` 了解有哪些檔案變更
   - 查看 `git diff` 了解具體變更內容

2. **選擇適當的 Type**
   - 根據變更性質選擇對應的 type
   - 如果是多種變更，選擇最主要的類型

3. **撰寫 Commit Message**
   - **標題**：使用 `<type>[scope]: <description>` 格式
     - description 使用中文，簡潔描述變更內容
     - 使用祈使語氣（如「新增」、「修復」、「更新」）
     - 第一行不超過 72 字元
   - **內文**（可選）：詳細說明變更原因和影響
   - **Footer**（可選）：如 `BREAKING CHANGE:` 或 `Closes #123`

4. **範例**

   ```
   feat(api): 新增房間建立 API 端點
   
   實作 POST /api/rooms 端點，支援建立新遊戲房間
   包含輸入驗證和錯誤處理
   ```

   ```
   fix(socket): 修復房間加入時的重複連線問題
   
   當使用者重複加入同一房間時，會建立多個 socket 連線
   現在會先檢查是否已存在連線，避免重複建立
   ```

   ```
   refactor(game): 重構狼人殺遊戲引擎
   
   將遊戲邏輯拆分為更小的函式，提升可讀性和可測試性
   不影響現有功能
   ```

   ```
   docs: 更新 API 文件
   ```

   ```
   chore: 更新依賴套件版本
   
   - next: 15.0.0 -> 15.1.0
   - prisma: 5.0.0 -> 5.1.0
   ```

## 執行方式

在 Agent 聊天框輸入 `/commit`，Agent 會：

1. 檢查 git 狀態和變更
2. 分析變更內容
3. 建議適當的 commit type 和 message
4. 協助撰寫符合 Conventional Commits 格式的 commit message

範例：
```
/commit
```

或指定特定檔案：
```
/commit @src/app/api/rooms/route.ts
```

## 注意事項

- ✅ 使用中文撰寫 commit message（符合專案規範）
- ✅ 標題使用祈使語氣
- ✅ 標題不超過 72 字元
- ✅ 內文和標題之間空一行
- ✅ 如果變更包含破壞性變更，使用 `BREAKING CHANGE:` footer
- ❌ 避免使用過去式（如「新增了」、「修復了」）
- ❌ 避免在標題結尾加句號
- ❌ 避免過於簡短的描述（如「fix bug」）

## 常見場景範例

### 新功能
```
feat(game): 新增狼人殺遊戲基本邏輯
feat(ui): 新增遊戲房間聊天功能
feat(api): 新增房間列表查詢 API
```

### 修復 Bug
```
fix(socket): 修復連線斷線後無法重連的問題
fix(db): 修復房間查詢時的型別錯誤
fix(ui): 修復聊天訊息顯示順序錯誤
```

### 重構
```
refactor(api): 重構房間 API 錯誤處理邏輯
refactor(game): 提取遊戲狀態管理為獨立模組
```

### 文件
```
docs: 更新專案 README
docs(api): 新增 API 使用說明文件
```

### 測試
```
test(game): 新增狼人殺遊戲引擎單元測試
test(api): 新增房間 API 整合測試
```

### 建置/工具
```
chore: 更新 ESLint 配置
chore: 更新依賴套件
ci: 新增 GitHub Actions 工作流程
```