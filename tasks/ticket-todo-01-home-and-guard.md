# Ticket todo-01: 首頁對齊 spec + /rooms navigation guard

**Source:** tasks/todo.md, spec/首頁.png

## 1. 首頁 app/page.tsx 對齊 spec/首頁.png

Spec 要求:
- 深色背景 (#1A1B26)
- 左上角 "Cluiche bord" 黃色
- 中央兩個按鈕垂直排列:
  - 建立房間：黃色背景，左側 + icon，文字白色
  - 進入房間：藍色背景，左側 icon，文字白色
- 使用 design tokens (globals.css)

## 2. /rooms navigation guard

- 在 `/rooms` 尚未實作前，用 redirect 或簡單 guard 擋住
- 可 redirect 回首頁並顯示「即將開放」訊息，或 render 一個 blocked 畫面

## Acceptance

- 首頁視覺對應 spec（深色、黃標題、兩按鈕）
- 點「建立房間」導向 /create-room；點「進入房間」可導向 /rooms 或暫時顯示 coming soon
- /rooms 有 guard，不顯示未完成功能
