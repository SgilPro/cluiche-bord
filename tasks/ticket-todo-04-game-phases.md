# Ticket todo-04: 遊戲階段 feature components

**Source:** spec 內夜晚階段、白天階段、狼人階段、女巫階段等 PNG；werewolf-flow.mmd

## 建立 components/pages/

- 同一路由（/game/[roomId]）根據 phase/sub_phase 渲染不同 feature
- 放在 components/pages/ 底下，例如:
  - NightWolvesPage, NightWitchPage, NightSeerPage, NightHunterCheckPage
  - DayAnnounceDeathsPage, DaySpeechPage, DayVotePage, HunterShootPage
  - SheriffRunPage, SheriffSpeechPage 等
- 每個 component 對應 spec 圖，使用 design tokens 與既有 UI 元件
- 主頁 /game/[roomId] 依 game state 的 phase/sub_phase 選擇要 render 哪個 component

## Acceptance

- components/pages/ 有各 phase 的 feature component
- /game/[roomId] 能依 state 切換顯示
