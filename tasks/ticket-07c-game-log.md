# Ticket 07c — Game Log 型別 + TTS 旁白 + 旁白文字顯示 + Log Panel

## 目標

後端 spec 007 已實作 Game Log 系統。前端需要：
1. 型別定義（PublicLogEntry、public_log、game_log_private）
2. TTS：每次有新 narration 時呼叫 Web SpeechSynthesis 朗讀
3. 最新旁白文字顯示：在遊戲頁底部固定顯示最新 narration
4. 可展開 Log Panel：顯示完整 public_log 列表

## 範圍

- `src/lib/games/werewolf/types.ts` — 加 PublicLogEntry + GameState.public_log
- `src/lib/channel/types.ts` — 加 ChannelGameState.public_log、game_log_private event
- 新建 `src/components/ui/GameLogPanel.tsx` — log 列表元件
- 新建 `src/components/ui/NarrationBar.tsx` — 底部旁白文字 + 展開 log 按鈕
- 修改 `src/app/game/[roomId]/page.tsx` — 整合 TTS + NarrationBar + GameLogPanel

## 一、型別

### `src/lib/games/werewolf/types.ts`

新增：
```ts
export interface PublicLogEntry {
  seq: number;
  type: string;
  phase: Phase;
  day: number;
  visibility: "public" | "private";
  visible_to: string[] | "all";
  narration: string | null;
  data: Record<string, unknown>;
  at: string; // ISO datetime string
}
```

`GameState` 加：
```ts
public_log?: PublicLogEntry[];
```

### `src/lib/channel/types.ts`

`ChannelGameState` 加：
```ts
public_log?: PublicLogEntry[];
```

（import PublicLogEntry from werewolf/types，或在 channel/types.ts 重新宣告相同介面）

`WerewolfChannelEvent` 加：
```ts
| "game_log_private"
```

新增 payload 型別：
```ts
export interface GameLogPrivatePayload {
  entries: PublicLogEntry[]; // 同結構，visibility: "private"
}
```

## 二、NarrationBar 元件

位置：`src/components/ui/NarrationBar.tsx`

```tsx
"use client";

import { BookOpen } from "lucide-react";

interface NarrationBarProps {
  narration: string | null;
  onOpenLog: () => void;
}

export default function NarrationBar({ narration, onOpenLog }: NarrationBarProps) {
  if (!narration) return null;
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40">
      <div className="flex items-center gap-2 bg-black/80 px-4 py-2">
        <p className="flex-1 text-sm text-white/90 line-clamp-2">{narration}</p>
        <button
          type="button"
          onClick={onOpenLog}
          className="shrink-0 rounded-lg p-1.5 text-white/60 hover:text-white"
          aria-label="查看遊戲記錄"
        >
          <BookOpen size={18} />
        </button>
      </div>
    </div>
  );
}
```

## 三、GameLogPanel 元件

位置：`src/components/ui/GameLogPanel.tsx`

```tsx
"use client";

import { X } from "lucide-react";
import type { PublicLogEntry } from "@/lib/games/werewolf/types";

interface GameLogPanelProps {
  entries: PublicLogEntry[];
  onClose: () => void;
}

export default function GameLogPanel({ entries, onClose }: GameLogPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-base font-semibold text-white">遊戲記錄</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 hover:text-white"
          aria-label="關閉"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-white/40 text-center py-8">尚無記錄</p>
        )}
        {[...entries].reverse().map((entry) => (
          <div key={entry.seq} className="rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/30">#{entry.seq}</span>
              <span className="text-[10px] text-white/40">
                第 {entry.day} {entry.phase === "night" ? "夜" : "天"} · {entry.type}
              </span>
            </div>
            {entry.narration && (
              <p className="text-sm text-white/80">{entry.narration}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 四、game page 整合

`src/app/game/[roomId]/page.tsx` 需要：

### State 新增
```ts
const [logPanelOpen, setLogPanelOpen] = useState(false);
const [latestNarration, setLatestNarration] = useState<string | null>(null);
const lastSpokenSeqRef = useRef<number>(-1);
```

### TTS hook（在 ch.on("state") 內或獨立 useEffect）

當 `gameState.public_log` 有新 entries 時（seq > lastSpokenSeqRef.current）：
```ts
useEffect(() => {
  if (!gameState?.public_log) return;
  const entries = gameState.public_log;
  if (entries.length === 0) return;

  const latest = entries[entries.length - 1];

  // Update narration display
  if (latest.narration) setLatestNarration(latest.narration);

  // TTS: speak only new entries
  const newEntries = entries.filter((e) => e.seq > lastSpokenSeqRef.current);
  if (newEntries.length === 0) return;
  lastSpokenSeqRef.current = entries[entries.length - 1].seq;

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel(); // cancel any ongoing speech
    newEntries.forEach((entry) => {
      if (!entry.narration) return;
      const utterance = new SpeechSynthesisUtterance(entry.narration);
      utterance.lang = "zh-TW";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    });
  }
}, [gameState?.public_log]);
```

### game_log_private event 監聽
```ts
ch.on("game_log_private", (payload) => {
  const { entries } = payload as { entries: PublicLogEntry[] };
  if (!entries || entries.length === 0) return;
  const latest = entries[entries.length - 1];
  if (latest.narration) setLatestNarration(latest.narration);

  // TTS for private entries
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    entries.forEach((entry) => {
      if (!entry.narration) return;
      const utterance = new SpeechSynthesisUtterance(entry.narration);
      utterance.lang = "zh-TW";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    });
  }
});
```

### NarrationBar + GameLogPanel 渲染

在 return 的最外層（在 PhaseRouter 同層）加入：
```tsx
{/* Log panel overlay */}
{logPanelOpen && (
  <GameLogPanel
    entries={gameState?.public_log ?? []}
    onClose={() => setLogPanelOpen(false)}
  />
)}

{/* Narration bar — fixed bottom（注意：若 ActionFooter 也在底部，z-index 需要配合） */}
{!logPanelOpen && (
  <NarrationBar
    narration={latestNarration}
    onOpenLog={() => setLogPanelOpen(true)}
  />
)}
```

**注意**：NarrationBar 在 ActionFooter 上方（ActionFooter 也是 fixed bottom）。
需要讓 NarrationBar 的 `bottom` 偏移 ActionFooter 高度（約 56px）或放在不同層。
可以把 NarrationBar 的 bottom 設為 `bottom-[56px]` 以免被 ActionFooter 遮住。
但這需要視實際情況微調，若有遮擋問題記錄在 report.md 即可。

## 五、exports

在 `src/components/ui/index.ts`（若存在）加入：
```ts
export { default as GameLogPanel } from "./GameLogPanel";
export { default as NarrationBar } from "./NarrationBar";
```

## 測試要求（TDD）

### `src/components/ui/NarrationBar.test.tsx`（新建）

1. 有 narration 時渲染文字
2. narration 為 null 時不渲染
3. 點擊 BookOpen 按鈕呼叫 `onOpenLog`

### `src/components/ui/GameLogPanel.test.tsx`（新建）

1. entries 為空時顯示「尚無記錄」
2. entries 有值時渲染 narration 文字
3. 點擊 X 按鈕呼叫 `onClose`
4. entries 依倒序顯示（最新在上）

### `src/lib/games/werewolf/types.test.ts`（加測試）

1. `GameState` 有 `public_log` 欄位（isGameState 不應要求此欄位必填）

TDD 流程：先寫失敗測試，再實作，確認通過。

## 驗收條件

- [ ] `PublicLogEntry` 型別完整
- [ ] `GameState.public_log` 加入
- [ ] `game_log_private` event 型別加入
- [ ] `NarrationBar` 顯示最新旁白
- [ ] `GameLogPanel` 顯示完整 public_log
- [ ] TTS 在 public_log 有新 entry 時朗讀（zh-TW，rate 0.9）
- [ ] `game_log_private` 收到時也朗讀並更新旁白
- [ ] 測試全數通過
- [ ] `npm run build` 通過

## Commit

```
feat(game): 加入 Game Log 型別、TTS 旁白、NarrationBar 與 GameLogPanel
```
