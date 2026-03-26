# Ticket 06a — exile_tie_speech / exile_tie_vote sub_phase UI

## 目標

後端已確認 `exile_tie_speech` 和 `exile_tie_vote` 是獨立 sub_phase。
流程：`vote` 平票 → `vote_tie` event（含 candidates）→ `exile_tie_speech`（候選人輪流發言）→ `exile_tie_vote`（只有非候選人能投票）→ 若再次平票 → `vote_no_exile`。

## 範圍

### 型別更新

**`src/lib/games/werewolf/types.ts`**

1. `SubPhase` union 加入 `"exile_tie_speech" | "exile_tie_vote"`
2. `SUB_PHASES` 陣列也加入這兩個值
3. `GameState` 加入 `exile_tie_speech_current_id?: string | null`（當前發言者的 player_id）
4. `VoteTiePayload` 加入（若不存在）：`tied_ids: string[]`

**`src/lib/channel/types.ts`**

1. `SubPhase` union 加入 `"exile_tie_speech" | "exile_tie_vote"`
2. `ChannelGameState` 加入 `exile_tie_speech_current_id?: string | null`

### 新元件

**`src/components/pages/ExileTieSpeechPage.tsx`**（參考 SheriffSpeechPage 結構）

顯示邏輯：
- Header：`第 X 天 · 平票發言`
- NotificationBanner：`「{currentSpeaker.nickname ?? 座位號}」正在發言`
- 若 `exile_tie_speech_current_id` 存在，在 PlayerCardGrid 中用 `isCurrentTarget` 標示當前發言者
- 候選人列表：從 `state.players` 過濾（前端無法得知哪些是候選人，顯示所有存活玩家，僅標示當前發言者）
- 房主可「強制推進」（`advance`）

```tsx
// 大致結構
export default function ExileTieSpeechPage({ state, myPlayerId, onAction }: PhasePageProps) {
  const { day_number, exile_tie_speech_current_id } = state;
  const isHost = state.players[0]?.id === myPlayerId;
  const alive = getAlivePlayers(state.players);

  const currentSpeaker = alive.find(p => p.id === exile_tie_speech_current_id);

  const cards = alive.map(p => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
    isCurrentTarget: p.id === exile_tie_speech_current_id,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header title={`第 ${day_number} 天 · 平票發言`} variant="werewolf" />
      <NotificationBanner
        message={currentSpeaker
          ? `「${currentSpeaker.nickname ?? `座位 ${currentSpeaker.seat_index + 1}`}」正在發言`
          : "等待發言者..."}
      />
      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        <PlayerCardGrid cards={cards} disabled />
      </main>
      {isHost && (
        <ActionFooter
          variant="light"
          right={{ label: "強制推進", onClick: () => onAction("advance", {}) }}
        />
      )}
    </div>
  );
}
```

**`src/components/pages/ExileTieVotePage.tsx`**（參考 DayVotePage 結構）

顯示邏輯：
- Header：`第 X 天 · 平票重投`
- NotificationBanner：`候選人不得投票，請其他玩家選擇放逐對象`
- `available_actions` 由後端控制，但前端也需要：若 `myPlayerId` 在候選人之中，`onSelect` 和「確認放逐」應被 disable
- **關鍵**：後端的 `available_actions` 會反映哪些人可以投票，但前端目前沒有讀 `available_actions`，所以用另一個方式：前端無法得知候選人 id（`vote_tie` event 的 `tied_ids` 不存在 GameState），因此只能依賴後端 push error 或直接 disable 所有按鈕（保守做法）
- 實際上，前端最安全的做法：顯示所有存活玩家可選，按「確認放逐」就 push `day_vote`，後端拒絕候選人的投票。UI 上可加一句提示「候選人不得投票」。
- 房主可「強制推進」

```tsx
export default function ExileTieVotePage({ state, myPlayerId, onAction }: PhasePageProps) {
  const { day_number, sheriff_id, timer_ends_at } = state;
  const alive = getAlivePlayers(state.players);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isHost = state.players[0]?.id === myPlayerId;

  const cards = alive.map(p => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
    isSelected: p.id === selectedId,
    badge: p.id === sheriff_id ? <Crown size={14} className="text-[var(--accent-primary)]" /> : undefined,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header title={`第 ${day_number} 天 · 平票重投`} variant="werewolf" />
      <NotificationBanner message="候選人不得投票，請其他玩家選擇放逐對象" />
      {timer_ends_at !== undefined && (
        <div className="mx-auto flex w-full max-w-[430px] items-center justify-center px-4 py-2">
          <PhaseTimer timerEndsAt={timer_ends_at} className="text-2xl" />
        </div>
      )}
      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        <PlayerCardGrid cards={cards} onSelect={id => setSelectedId(prev => prev === id ? null : id)} />
      </main>
      <ActionFooter
        variant="light"
        left={isHost ? { label: "強制推進", onClick: () => onAction("advance", {}) } : undefined}
        center={{ label: "取消選擇", onClick: () => setSelectedId(null), disabled: selectedId === null }}
        right={{ label: "確認放逐", onClick: () => { if (selectedId) onAction("day_vote", { target_id: selectedId }); }, disabled: selectedId === null }}
      />
    </div>
  );
}
```

### PhaseRouter 更新

**`src/components/pages/PhaseRouter.tsx`**

在 `phase === "day"` 的 switch 中加入：

```tsx
case "exile_tie_speech":
  return <ExileTieSpeechPage {...props} />;
case "exile_tie_vote":
  return <ExileTieVotePage {...props} />;
```

並加入 import。

### Index 更新

**`src/components/pages/index.ts`**

加入：
```ts
export { default as ExileTieSpeechPage } from "./ExileTieSpeechPage";
export { default as ExileTieVotePage } from "./ExileTieVotePage";
```

## 測試要求（TDD）

### `src/lib/games/werewolf/types.test.ts`（已存在）

新增：
- `isSubPhase("exile_tie_speech")` → true
- `isSubPhase("exile_tie_vote")` → true
- `isGameState` 接受含 `exile_tie_speech_current_id` 的 state

### `src/components/pages/ExileTieSpeechPage.test.tsx`（新建）

1. 渲染 `第 X 天 · 平票發言` header
2. 顯示當前發言者 nickname（若 `exile_tie_speech_current_id` 有值）
3. 若無當前發言者，顯示 `等待發言者...`
4. 房主看到「強制推進」按鈕

### `src/components/pages/ExileTieVotePage.test.tsx`（新建）

1. 渲染 `第 X 天 · 平票重投` header
2. 顯示 `候選人不得投票` 提示
3. 選擇玩家後「確認放逐」按鈕啟用
4. 點「確認放逐」呼叫 `onAction("day_vote", { target_id: ... })`
5. 房主看到「強制推進」按鈕

**TDD 流程：先寫測試，確認 fail，再實作，確認 pass。**

## 驗收條件

- [ ] SubPhase 型別包含 `exile_tie_speech` / `exile_tie_vote`
- [ ] GameState 包含 `exile_tie_speech_current_id`
- [ ] ExileTieSpeechPage 顯示當前發言者
- [ ] ExileTieVotePage 功能正常（選擇 + 投票）
- [ ] PhaseRouter 正確 routing
- [ ] 所有新測試通過
- [ ] `npm run build` 通過
- [ ] `npm test` 全數通過

## Commit 格式

```
feat(game): 實作 exile_tie_speech / exile_tie_vote sub_phase UI
```
