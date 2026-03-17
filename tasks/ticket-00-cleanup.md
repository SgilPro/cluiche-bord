# Ticket 00: Cleanup – Frontend-only Next 16 (App Router)

**Goal:** Remove all full-stack/backend code from this repo. Backend moves to Elixir; this repo = Next 16 + App Router only.

## Checklist

- [ ] Remove Prisma: delete `prisma/` folder, `src/generated/prisma/`, `src/lib/db/`
- [ ] Remove API routes: delete `src/app/api/` (e.g. `api/rooms/route.ts`, `api/test-db/route.ts`)
- [ ] Remove socket-server: delete `socket-server.ts`, `socket-server.js`; remove script `socket-server` from package.json
- [ ] Remove socket client usage: delete or gut `src/lib/socket.ts`; remove pages/components that depend on it (game page, rooms page, Chat/GameChat that use socket.io)
- [ ] Strip package.json: remove `@prisma/client`, `prisma`, `socket.io`, `socket.io-client`, `simple-peer`, `@types/simple-peer`; remove `qrcode.react` if only used for old join flow
- [ ] Keep minimal app shell: `src/app/layout.tsx`, `src/app/page.tsx` (simple landing or placeholder), `src/app/globals.css`, next.config.ts, tsconfig.json, tailwind/postcss
- [ ] Remove or replace `src/app/rooms/page.tsx`, `src/app/game/[roomId]/page.tsx` so they don’t import Prisma or socket (can be stubs that link to “coming soon” or new routes later)
- [ ] Remove `src/lib/games/werewolf/engine.ts` if it was for in-repo game logic (backend owns engine)
- [ ] Optional: remove scripts that only start socket-server or test DB
- [ ] Run `npm install` and `npm run build` to confirm no broken imports

## Notes

- Next version: keep 15.x for now unless Next 16 is specified; report.md records “upgrade to 16 when available” if needed.
- Data folder `data/` and `docs/` can stay; remove only if they are Prisma/socket-specific and unused.
