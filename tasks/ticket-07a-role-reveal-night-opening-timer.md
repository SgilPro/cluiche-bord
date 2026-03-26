# Ticket 07a — role_reveal / night_opening 加入 timer + host advance

## 目標

`RoleRevealScreen` 和 `NightOpeningScreen` 已存在且在 game page 直接渲染，
但缺少：
1. timer 倒數顯示（`PhaseTimer`，使用 `state.timer_ends_at`）
2. host 可按「推進」（non-host 不能 advance，spec FR-007）

## 範圍

修改 3 個檔案（不動 PhaseRouter）：
- `src/components/pages/RoleRevealScreen.tsx`
- `src/components/pages/NightOpeningScreen.tsx`
- `src/app/game/[roomId]/page.tsx`

## RoleRevealScreen props 更新

```tsx
interface RoleRevealScreenProps {
  role: RoleId;
  timerEndsAt?: number;   // 新增
  isHost?: boolean;       // 新增
  onAdvance?: () => void; // 新增
}
```

在畫面中：
- 加入 `<PhaseTimer timerEndsAt={timerEndsAt} className="text-3xl" />` 顯示倒數
- 若 `isHost && onAdvance`，在底部加「推進」按鈕（參考其他 page 的 ActionFooter 用法，或簡單的 button）

## NightOpeningScreen props 更新

```tsx
interface NightOpeningScreenProps {
  dayNumber: number;
  timerEndsAt?: number;   // 新增
  isHost?: boolean;       // 新增
  onAdvance?: () => void; // 新增
}
```

同上，加 PhaseTimer 和 host 推進按鈕。

## game/[roomId]/page.tsx 更新

目前渲染方式（L129-137）：
```tsx
if (gameState?.sub_phase === "role_reveal") {
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const role = myPlayer?.role ?? "villager";
  return <RoleRevealScreen role={role} />;
}

if (gameState?.sub_phase === "night_opening") {
  return <NightOpeningScreen dayNumber={gameState.day_number} />;
}
```

改為：
```tsx
if (gameState?.sub_phase === "role_reveal") {
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
  const role = myPlayer?.role ?? "villager";
  const isHost = gameState.players[0]?.id === myPlayerId;
  return (
    <RoleRevealScreen
      role={role}
      timerEndsAt={gameState.timer_ends_at}
      isHost={isHost}
      onAdvance={() => onAction("advance", {})}
    />
  );
}

if (gameState?.sub_phase === "night_opening") {
  const isHost = gameState.players[0]?.id === myPlayerId;
  return (
    <NightOpeningScreen
      dayNumber={gameState.day_number}
      timerEndsAt={gameState.timer_ends_at}
      isHost={isHost}
      onAdvance={() => onAction("advance", {})}
    />
  );
}
```

## 測試要求（TDD）

### `RoleRevealScreen.test.tsx`（已存在或新建）

1. 渲染角色名稱
2. 傳入 `timerEndsAt` 時顯示 PhaseTimer
3. `isHost=true` + `onAdvance` 時顯示「推進」按鈕
4. `isHost=false` 時不顯示「推進」按鈕
5. 點擊「推進」按鈕呼叫 `onAdvance`

### `NightOpeningScreen.test.tsx`（已存在或新建）

1. 渲染「請所有玩家閉上雙眼」或天黑提示
2. 傳入 `timerEndsAt` 時顯示 PhaseTimer
3. `isHost=true` + `onAdvance` 時顯示「推進」按鈕
4. `isHost=false` 時不顯示

先讓測試 fail（若 test 已存在先 run），再實作，再確認 pass。

## 驗收條件

- [ ] 兩個 Screen 元件顯示 PhaseTimer（timerEndsAt 存在時）
- [ ] Host 看到推進按鈕；non-host 不顯示
- [ ] game page 傳入正確 props
- [ ] 測試全數通過
- [ ] `npm run build` 通過

## Commit

```
feat(game): role_reveal / night_opening 加入 timer 倒數與 host advance 按鈕
```
