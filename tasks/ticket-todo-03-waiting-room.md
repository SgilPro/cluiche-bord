# Ticket todo-03: rooms/[roomId] 等待加入頁

**Source:** spec/等待加入頁-房主.png、spec/等待加入頁-玩家.png

不實作：等待加入頁-玩家-1.png、iPhone 16 & 17 Pro - 5.png（不同 layout，暫不處理）

## 建立 app/rooms/[roomId]/page.tsx

- 對齊 spec：Header（Werewolf）、狀態橫幅、SegmentedControl（重新排序/變更房主）、玩家列表、底部按鈕（離開房間、開始遊戲）
- 房主 vs 玩家：依 API/state 判斷，顯示對應 UI（房主有「開始遊戲」等）
- 使用：Header、NotificationBanner、SegmentedControl、PlayerListItem、FixedBottomBar、Button
- API: getRoom、joinRoom、leaveRoom；可先 mock 或接 Elixir

## Acceptance

- 路由 /rooms/[roomId] 可進入
- 視覺對齊 spec（房主/玩家兩種狀態）
