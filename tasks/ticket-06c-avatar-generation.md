# Ticket 06c — Avatar 生成（user_id hash → 色塊）

## 目標

後端不提供 avatar 欄位。前端用 `player.id`（user_id）hash 生成確定性色塊 avatar，
取代 `PlayerCardGrid` 裡的 `<User>` icon 佔位符。

## 範圍

- 新建：`src/lib/utils/avatar.ts`（純函式，無副作用）
- 修改：`src/components/ui/PlayerCardGrid.tsx`

## 實作說明

### `src/lib/utils/avatar.ts`

```ts
/**
 * Deterministic avatar color generator based on player ID.
 * No backend required — derived from user_id hash.
 */

/** Palette of 8 distinct colors using design tokens or fixed values */
const AVATAR_COLORS = [
  "#E57373", // red
  "#FFB74D", // orange
  "#FFF176", // yellow
  "#81C784", // green
  "#4FC3F7", // blue
  "#CE93D8", // purple
  "#F48FB1", // pink
  "#80DEEA", // teal
];

/**
 * Simple djb2-style string hash → index into color palette.
 */
function hashStringToIndex(str: string, buckets: number): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash) % buckets;
}

export function getAvatarColor(playerId: string): string {
  return AVATAR_COLORS[hashStringToIndex(playerId, AVATAR_COLORS.length)];
}

/**
 * Returns initials for the player: first char of nickname or seat label.
 */
export function getAvatarInitial(nickname: string | null | undefined, seatIndex: number): string {
  if (nickname && nickname.length > 0) return nickname[0].toUpperCase();
  return String(seatIndex + 1);
}
```

### `src/components/ui/PlayerCardGrid.tsx`

將 avatar 區塊：

```tsx
<div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background-muted)]">
  <User size={20} className="text-[var(--text-secondary)]" />
</div>
```

改為：

```tsx
<div
  className="mt-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
  style={{
    backgroundColor: getAvatarColor(player.id),
    color: "#fff",
  }}
>
  {getAvatarInitial(player.nickname, player.seat_index)}
</div>
```

並移除 `import { User } from "lucide-react"`（若不再使用）。
加入 import：`import { getAvatarColor, getAvatarInitial } from "@/lib/utils/avatar";`

## 測試要求（TDD）

### `src/lib/utils/avatar.test.ts`（新建）

1. `getAvatarColor` 對相同 id 永遠回傳相同顏色
2. `getAvatarColor` 回傳值在 AVATAR_COLORS 陣列內
3. `getAvatarColor` 對不同 id 不一定相同（至少兩個已知 id 應不同）
4. `getAvatarInitial` 有 nickname 時回傳首字大寫
5. `getAvatarInitial` 無 nickname 時回傳座位號（seatIndex + 1）

先讓測試 fail，再實作讓它 pass。

## 驗收條件

- [ ] `getAvatarColor` / `getAvatarInitial` 測試全通過
- [ ] `PlayerCardGrid` 渲染色塊而非 `<User>` icon
- [ ] `npm run build` 通過
- [ ] `npm test` 全數通過

## Commit 格式

```
feat(ui): PlayerCardGrid 改用 user_id hash 色塊 avatar
```
