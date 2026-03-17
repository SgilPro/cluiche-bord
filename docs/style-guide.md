# Style Guide (from spec/ PNGs)

Patterns and components inferred from `spec/`. Use with `docs/design-tokens.md`.

---

## 1. App / Page structure

- **Lobby (首頁):** Dark background, centered vertical stack of two CTAs (建立房間 yellow, 進入房間 blue). Title "Cluiche bord" top-left, light yellow.
- **Form screens (建立房間):** Dark background; yellow horizontal bar with page title; form area with labeled inputs; footer with Cancel (red) + Confirm (green).
- **Game / Waiting (等待加入頁):** Dark red header with game title and share icon; white content area (banner, segmented control, player list); fixed bottom bar with two full-width buttons (Leave red, Start green).

---

## 2. Buttons

- **Primary (CTA):** Yellow bg, black text, optional left icon (+). Used for main action (建立房間).
- **Secondary:** Blue bg, white text, optional left icon. Used for 進入房間.
- **Confirm / Success:** Green bg, white text and icon (○). Used for 確認建立, 開始遊戲.
- **Cancel / Danger:** Red bg, white text and icon (×). Used for 取消建立, 離開房間.
- **Segmented:** One active (blue bg, white text), others inactive (yellow bg, black text). Used for 重新排序 / 變更房主.

Shape: rounded rectangle; consistent padding. Prefer a single `Button` component with `variant`: `primary` | `secondary` | `success` | `danger` | `segment`.

---

## 3. Form fields

- Label above input, light gray text.
- Input: white bg, rounded corners, full width.
- Optional info icon (?) to the right, blue outline, for 選擇遊戲 / 規則變體.
- Reusable: `FormField` or `Input` with `label`, `placeholder`, optional `infoIcon` / `onInfoClick`.

---

## 4. Header

- **Lobby:** App name only (e.g. "Cluiche bord"), light yellow, top-left.
- **Form:** App name + yellow bar with page title (e.g. "建立房間") in dark text.
- **Game:** Dark red bar, large white title (e.g. "Werewolf"), optional right icon (share).

Reusable: `Header` with `title`, optional `subtitle` or `pageTitle`, optional `actionIcon` and `onActionClick`.

---

## 5. Notification / status banner

- White bg, primary message (black) and optional secondary (gray). Dismiss (×) on the right.
- Example: "正在等待玩家加入房間..." (secondary) + "目前人數 8/10 人..." (primary).

Reusable: `NotificationBanner` with `message`, `secondaryMessage?`, `dismissible?`, `onDismiss?`.

---

## 6. Player list

- Vertical list; each row: number (left), name or "等待玩家加入..." (center), avatar or placeholder (right).
- Host row: teal/green bg, crown icon next to name.
- Open slot: gray placeholder text, same avatar circle.
- Avatar: circular placeholder (light gray) when no image.

Reusable: `PlayerListItem` with `seatNumber`, `name?`, `isHost?`, `isEmpty?`, `avatarUrl?`. `PlayerList` wraps multiple items.

---

## 7. Bottom action bar

- Fixed at bottom; two equal-width buttons side by side (e.g. 離開房間 | 開始遊戲).
- Left often danger (red), right often success (green). Full-width, consistent height.

Reusable: `ActionBar` or `FixedBottomBar` with two `ActionButton` children (or slots).

---

## 8. Icons (from spec)

- Plus (+), Enter/door, × (close), ○ (confirm), ?, Crown, Share (arrow in box), Reorder (two arrows), Pencil, Exit (arrow out), Play (outline circle).
- Prefer a small icon set or SVG sprite; keep style consistent (outline vs fill).

---

## 9. Do’s and don’ts

- **Do** use design tokens for all colors, spacing, radius, and type.
- **Do** keep dark background for lobby/form and dark red header for in-game.
- **Do** use consistent button variants (primary = yellow, secondary = blue, success = green, danger = red).
- **Don’t** introduce new accent colors without adding a token.
- **Don’t** assume responsive behavior; spec is single layout (likely mobile). Document breakpoints when defined.

---

## 10. Missing / incomplete in spec

- **Interaction states:** Hover, focus, disabled for buttons and inputs.
- **Errors:** Validation messages, inline or toast.
- **Loading:** Spinners or skeletons.
- **Responsive:** Breakpoints and layout changes for tablet/desktop.
- **Accessibility:** Focus order, contrast, screen reader text.
- **Copy:** Some strings inferred from PNGs; need final copy for i18n later.
- **Icon set:** Only a few icons shown; full set and naming TBD.

These should be added when design is finalized or in a later iteration.
