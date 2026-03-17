# Ticket 02: Design Tokens & Style Guide from spec/

**Goal:** Extract Design Tokens and a Style Guide from the PNGs in `spec/`, and document gaps.

## Inputs

- `spec/*.png` – All design screens (首頁, 建立房間, 建立成功頁, 等待加入頁-房主/玩家, 白天階段-上警環節, 夜晚階段, 女巫使用藥水階段, 狼人投票殺害階段, 狼人階段-非狼人玩家, etc.)

## Deliverables

1. **Design Tokens** (e.g. `docs/design-tokens.md` or `tasks/design-tokens.md`)
   - Colors (primary, background, surface, text, borders, success/error)
   - Spacing (e.g. 4/8/16/24/32 scale)
   - Border radius
   - Typography: font family, sizes, weights
   - Shadows, breakpoints (if inferrable)

2. **Style Guide** (e.g. `docs/style-guide.md` or `tasks/style-guide.md`)
   - Reusable patterns: buttons (primary/secondary), cards, lists, modals, room/game layout
   - Do’s and don’ts
   - References to which spec image each pattern comes from

3. **Gaps** (in report.md or at end of style-guide)
   - Missing: token source (no design tool export), responsive breakpoints, dark/light mode, a11y (contrast, focus)
   - Incomplete: any unclear or missing copy (Chinese strings)

## Acceptance

- A human or subagent can implement shared components (Ticket 03) using only these two docs.
- Gaps are explicitly listed so we know what to add when design is finalized.
