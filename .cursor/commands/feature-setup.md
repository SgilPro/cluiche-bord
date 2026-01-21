# 新功能開發設定指令

建立新功能的完整開發環境，包括分支、資料模型、API 和測試框架。

## 開發流程

### 1. 需求分析
- 定義功能需求和技術方案
- 確認與現有系統的整合點
- 識別需要的資料模型變更

### 2. 建立分支
- 建立功能分支：`git checkout -b feature/功能名稱`
- 確保從最新的 `develop` 分支建立

### 3. 資料模型設計
- 在 `prisma/schema.prisma` 中定義新的資料模型
- 考慮關聯性和索引
- 建立 migration：`npx prisma migrate dev --name 功能名稱`

### 4. API 設計
- 在 `src/app/api/` 中建立 API 路由
- 定義請求/回應型別
- 實作 CRUD 操作（如需要）
- 加入認證/授權檢查

### 5. 前端元件
- 在 `src/components/` 或 `src/app/components/` 建立元件
- 使用 TypeScript 定義 props 型別
- 實作響應式設計（如需要）

### 6. Socket.IO 事件（如需要）
- 在 `socket-server.js` 中定義新的事件處理
- 更新 `src/lib/socket.ts` 的型別定義
- 確保事件命名遵循規範

### 7. 測試框架
- 建立單元測試檔案
- 建立整合測試（如需要）
- 確保測試覆蓋主要功能

### 8. 文件更新
- 更新 API 文件（如需要）
- 更新 `docs/plan.md` 中的進度
- 在 README 中說明新功能（如需要）

## 執行方式

在 Agent 聊天框輸入 `/feature-setup` 並描述功能需求，例如：
```
/feature-setup 建立好友系統，包含新增好友、好友列表、好友狀態等功能
```

Agent 會自動執行上述步驟並建立完整的開發環境。
