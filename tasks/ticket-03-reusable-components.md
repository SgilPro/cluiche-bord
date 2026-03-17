# Ticket 03: Reusable Components from spec/

**Goal:** Implement shared UI components based on spec/ PNGs and the Design Tokens + Style Guide (Ticket 02).

## Prerequisite

- Ticket 02 (Design Tokens & Style Guide) done or drafted. ✅

## Scope

Build in Next 16 App Router (e.g. `src/components/ui/` or `src/components/design-system/`):

- [x] Buttons (primary, secondary, success, danger, segment) – `Button.tsx`
- [ ] Cards / panels
- [x] Player list item (avatar, name, status, host, empty slot) – `PlayerListItem.tsx`
- [x] Room header / phase title – `Header.tsx` (default + werewolf variant)
- [ ] Action panels (night/day actions)
- [ ] Modals / overlays
- [x] Form field with label and optional info icon – `FormField.tsx`
- [ ] NotificationBanner, ActionBar, SegmentedControl (see style-guide)

Use Design Tokens (CSS variables in globals.css) and follow the Style Guide. Prefer server components where possible; client only where interactivity is required.

## Status

Started: `src/components/ui/` with Button, FormField, Header, PlayerListItem; exported from `index.ts`. Remaining items can be implemented in parallel when building screens (04d).
