# Design Tokens

**Color source:** Figma (confirmed). Earlier values were inferred from spec PNGs and have been corrected below where they differed.

---

## Colors

### Backgrounds
| Token | Value | Usage | Note |
|-------|--------|--------|------|
| `background.primary` | `#1A1B26` | Main app background (首頁, 建立房間) | Was `#1A1C25` (close) |
| `background.surface` | `#FFFFFF` | Cards, form areas, player rows | ✓ |
| `background.header.werewolf` | `#2F0000` | Game/waiting room header (等待加入頁) | Was `#530000` (Figma 較深) |
| `background.input` | `#FFFFFF` | Input fields | ✓ |
| `background.muted` | `#1C202B` | Alternate dark surface | Figma |
| `background.dark` | `#323949`, `#2D283E` | Dark panels | Figma |

### Accent / Brand
| Token | Value | Usage | Note |
|-------|--------|--------|------|
| `accent.primary` | `#FFC107` | Primary CTA, page title bar | Was `#FFD700`; Figma 偏琥珀 |
| `accent.yellow` | `#F9A825`, `#FFE606` | Title, highlight | Figma |
| `accent.secondary` | `#3D5AFE` | Secondary CTA, active tab | Was `#4169E1`; Figma 偏靛藍 |
| `accent.blue` | `#00B0FF`, `#00AEFF` | Links, active state | Figma |
| `accent.green` | `#00CCAA` | Host row, teal accent | Was `#00C896` (接近) |
| `accent.info` | `#00B0FF` | Help/info icons | Was `#00BFFF` (接近) |
| `accent.magenta` | `#EF60FF` | Decorative / special | Figma |

### Actions
| Token | Value | Usage | Note |
|-------|--------|--------|------|
| `action.primary` | `#00E676` | Confirm, Start Game | Was `#32CD32` |
| `action.success` | `#00E676`, `#00FF48` | Success state | Figma |
| `action.danger` | `#F23538`, `#FF5252`, `#FF4444` | Cancel, Leave Room | Was `#DC143C` / `#FF3B30` |

### Text
| Token | Value | Usage | Note |
|-------|--------|--------|------|
| `text.primary` | `#000000` | Main text on light bg | ✓ |
| `text.secondary` | `#A1A1AA` | Labels, secondary status | Was `#B0B0B0` |
| `text.muted` | `#787878`, `#A8A8A8` | Disabled, placeholder text | Figma |
| `text.onDark` | `#FFFFFF` | Header, buttons on dark | ✓ |
| `text.onPrimary` | `#000000` | Text on yellow/primary button | ✓ |

### UI
| Token | Value | Usage | Note |
|-------|--------|--------|------|
| `placeholder.avatar` | `#D9D9D9` | Avatar circle placeholder | Was `#E0E0E0` |
| `placeholder.general` | `#94A3B8` | Input placeholder, slate | Figma |
| `icon.crown` | `#F9A825` / `#FFE606` | Host crown | Was `#FFCC00` |
| `overlay.dark` | `#00000099` | Modal backdrop (60% black) | Figma |
| `overlay.green` | `#00E67699` | Success overlay (60%) | Figma |
| `overlay.magenta` | `#EF60FF99` | Decorative (60%) | Figma |

### Other (Figma palette, for reference)
- `#E8F0F8` – light blue tint
- `#33063E` – dark purple
- `#1A1625` – dark purple-black
- `#FF8C7A` – coral/salmon
- `#C9652B` – orange/brown

---

## Summary: Image vs Figma 對照

| 當初推測 (看圖) | Figma 正確值 | 誤差 |
|------------------|--------------|------|
| `background.primary` #1A1C25 | #1A1B26 | 極小 |
| `background.header.werewolf` #530000 | #2F0000 | 圖偏亮，Figma 更深 |
| `accent.primary` #FFD700 | #FFC107 | 圖偏亮黃，Figma 琥珀 |
| `accent.secondary` #4169E1 | #3D5AFE | 圖偏藍，Figma 靛藍 |
| `accent.green` #00C896 | #00CCAA | 接近 |
| `action.primary` / success #32CD32 | #00E676 | 圖偏黃綠，Figma 螢光綠 |
| `action.danger` #DC143C | #F23538 / #FF5252 | 不同紅 |
| `text.secondary` #B0B0B0 | #A1A1AA | 接近 |
| `placeholder.avatar` #E0E0E0 | #D9D9D9 | 接近 |

---

## Typography

| Token | Value | Usage |
|-------|--------|--------|
| `font.family.sans` | Sans-serif (e.g. system-ui, "Noto Sans TC") | Body, UI |
| `font.size.hero` | ~24–28px | App/game title (e.g. "Werewolf") |
| `font.size.xl` | ~20px | Page title ("建立房間") |
| `font.size.lg` | ~18px | Section titles |
| `font.size.md` | ~16px | Body, buttons, labels |
| `font.size.sm` | ~14px | Secondary text |
| `font.weight.bold` | 700 | Titles |
| `font.weight.medium` | 500 | Page title bar |
| `font.weight.regular` | 400 | Body, labels |

Exact font family not in Figma export; app uses Geist. Consider adding `--font-geist-sans` to tokens.

---

## Spacing

| Token | Value | Usage |
|-------|--------|--------|
| `space.1` | 4px | Tight gaps |
| `space.2` | 8px | Inline spacing |
| `space.3` | 12px | Small padding |
| `space.4` | 16px | Default padding |
| `space.5` | 20px | Section spacing |
| `space.6` | 24px | Large section |
| `space.8` | 32px | Page margins |

---

## Border Radius

| Token | Value | Usage |
|-------|--------|--------|
| `radius.sm` | 4px | Inputs, small controls |
| `radius.md` | 8px | Buttons, cards |
| `radius.lg` | 12px | Modals, panels |
| `radius.full` | 50% | Avatars, circles |

---

## Gaps (not in Figma export)

- **Shadows / elevation:** Not in list; use subtle shadows for cards/modals if needed.
- **Breakpoints:** Recommend mobile-first 640 / 768 / 1024.
- **Focus / a11y:** Add focus rings and contrast checks.
