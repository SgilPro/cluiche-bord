# 專案實作計畫

本目錄包含專案各階段的詳細實作計畫。

## 計畫概覽

### Phase 0: 基礎設施設定
**檔案**: `phase0-infra-setup.md`

設定 Supabase PostgreSQL 資料庫，完成 Prisma 連線與 migration 驗證。

**狀態**: 待開始

**執行方式**: 可以指派給專門的 Infra Agent，參考 `infra-agent-task.md`

---

### Phase 1: 房間持久化重構
**檔案**: `phase1-room-persistence.md`

將房間系統從檔案系統（`data/rooms.json`）遷移到 PostgreSQL（Prisma），同時保持現有前端與 Socket.IO 行為不變。

**狀態**: 待開始（需先完成 Phase 0）

**關鍵任務**:
- Prisma Schema 調整
- 資料庫操作層實作
- API Routes 重構
- Socket.IO 伺服器更新

---

### Phase 2: 狼人殺遊戲實作
**檔案**: `phase2-werewolf-game.md`

實作完整的狼人殺遊戲功能，包括遊戲邏輯、狀態管理、Socket.IO 同步。

**狀態**: 待開始（需先完成 Phase 1）

**策略**: 先實作，後抽象。先讓遊戲能跑起來，未來實作更多遊戲後再重構成抽象層。

**關鍵任務**:
- 遊戲資料模型設計
- 狼人殺核心邏輯實作
- Socket.IO 遊戲事件
- 前端遊戲 UI

---

## 執行順序

1. **Phase 0** → 設定資料庫基礎設施
2. **Phase 1** → 房間系統持久化
3. **Phase 2** → 狼人殺遊戲實作

## 使用方式

### 對於 Executor Agent
- 閱讀對應 Phase 的計畫檔案
- 按照任務清單逐步執行
- 完成後更新狀態並進行驗收

### 對於 Planner Agent
- 根據專案進度更新計畫
- 調整任務優先順序
- 補充詳細實作細節

## 相關文件
- 專案規劃：`docs/plan.md`
- 專案規格：`docs/spec.md`
- 當前狀態：`.cursor/context/current-state.md`
