# Ticket todo-02: create-room 頁面（建立房間 + 建立成功）

**Source:** tasks/todo.md. 注意：沒有 spec/建立房間頁.png，需參考 design-tokens、style-guide、其他 spec 推敲。

## 1. 建立 app/create-room/page.tsx

- 表單欄位（參考 style-guide）：房間名稱、玩家暱稱、選擇遊戲、規則變體
- 按鈕：取消建立（紅）、確認建立（綠）
- 使用現有 FormField、Button、Header 等 UI 元件
- API: createGuest + createRoom（先 mock 或接真實 API 皆可）

## 2. 建立成功 state

- 與建立房間同一個 page，用 state 切換「表單」vs「建立成功」畫面
- 建立成功頁對應 spec/建立成功頁.png（顯示成功訊息，可提供房間連結/代碼）

## Acceptance

- /create-room 可填表、送出
- 成功後顯示建立成功畫面（同一頁，state 控制）
