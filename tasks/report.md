# Cluiche Bord Rewrite – Progress Report

**Last updated:** (auto)  
**Mode:** Unsupervised long-run. Non-blocking issues and open decisions recorded here.

---

## 0. Cleanup (Current Branch)

**Status:** Done.

**Scope:**
- Remove Prisma (schema, migrations, generated client, `src/lib/db`, `src/app/api/*`, `src/generated/prisma`).
- Remove socket-server (Node): `socket-server.ts`, `socket-server.js`, `src/lib/socket.ts`, socket-related UI.
- Remove legacy full-stack code under `src/` that depends on Prisma or socket-server; keep only what Next 16 + App Router needs for a **frontend-only** app (Elixir backend will serve REST + Channel).
- Next: 15.3.2 (upgrade to 16 when available). No API routes in this repo for rooms/games (those live in Elixir).

**Done:**
- [x] Deleted `prisma/`, `src/generated/`, `src/lib/db/`, `src/app/api/`.
- [x] Deleted `socket-server.ts`, `socket-server.js`; removed `socket-server` script; deleted `scripts/test-db-connection.ts`.
- [x] Stripped `package.json` of `@prisma/client`, `prisma`, `socket.io`, `socket.io-client`, `qrcode.react`, `simple-peer`, `@types/simple-peer`.
- [x] Replaced `src/app/page.tsx`, `src/app/rooms/page.tsx`, `src/app/game/[roomId]/page.tsx` with stubs; removed `GameChat`, `Chat`, `src/lib/socket.ts`, `src/lib/games/werewolf/engine.ts`.
- [x] Kept: `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind`, `layout.tsx`, `globals.css`, `src/lib/games/werewolf/types.ts` (for Ticket 04c alignment later).

**Build:** `npm run build` passes.

**Non-blocking:** Next.js warns about `viewport` in metadata — consider moving to `viewport` export (see Next docs). Noted in §5 below.

---

## 1. .openskills / Superpower (prpm)

**Status:** Reviewed.

**Location:** `.openskills/` (skills installed via prpm under `.openskills`).

**Relevant skills for this rewrite:**
- **skill-using-superpowers** – Mandatory: list skills → if any match, read with Skill tool → announce usage → follow skill. Use for any multi-step or checklist task.
- **skill-dispatching-parallel-agents** – Use when 3+ independent workstreams (e.g. design tokens, components, API client) can be done in parallel by subagents.
- **skill-writing-plans** – For breaking down design/API/flow into ordered steps.
- **skill-subagent-driven-development** – When delegating to subagents (e.g. explore, shell, generalPurpose).
- **skill-executing-plans** – Execute tickets in order where dependencies exist.
- **skill-verification-before-completion** – Before marking a ticket done, verify it meets the spec (e.g. Design Tokens doc, Style Guide, contract alignment).

**How subagents will use them:**
- **Main agent:** Before each phase, list skills → if “dispatching-parallel-agents” or “subagent-driven-development” applies, invoke mcp_task with clear scope and “return summary to report”.
- **Subagents:** Given a ticket (e.g. “Extract Design Tokens from spec/”), they run in readonly or write mode as needed; they do not have Skill tool, so the main agent will pass condensed instructions (e.g. “follow design-tokens ticket; output tokens in tasks/design-tokens.md”).
- **Checklists:** When a skill has a checklist, main agent creates TodoWrite todos for each item and marks them complete as subagents or main agent finish.

**Open point:** prpm/superpower “Skill tool” – if the environment exposes a Skill tool to read `.openskills` files, the main agent will use it for “using-superpowers” and “dispatching-parallel-agents”. If not, the above is applied from the already-read SKILL.md content.

---

## 2. Design Tokens & Style Guide (from spec/)

**Status:** Done (draft).

**Deliverables:**
- **Design Tokens:** `docs/design-tokens.md` – colors (backgrounds, accents, actions, text), typography, spacing, border-radius; CSS variables added to `src/app/globals.css`.
- **Style Guide:** `docs/style-guide.md` – app structure, buttons, form fields, header, notification banner, player list, bottom action bar, icons, do’s/don’ts, and **missing/incomplete** (§10): hover/focus/disabled, errors, loading, responsive, a11y, copy, full icon set.

**Gaps (recorded in style-guide §10 and design-tokens):** No design tool export; breakpoints proposed but not in spec; no dark/light mode or a11y in PNGs; copy inferred from screenshots.

---

## 3. Reusable Components (from spec/)

**Status:** Started.

**Done:** `src/components/ui/` – `Button` (variants: primary, secondary, success, danger, segment), `FormField` (label, optional info icon), `Header` (title, optional pageTitle bar, variant default/werewolf, actionIcon), `PlayerListItem` (seatNumber, name, isHost, isEmpty, avatarUrl). Exported from `src/components/ui/index.ts`. Design tokens wired in `globals.css`.

**Remaining (can be parallelized later):** NotificationBanner, ActionBar/FixedBottomBar, SegmentedControl, modal/overlay. Optional: next/image for PlayerListItem avatar (ESLint suggests it; currently using `<img>`).

---

## 4. API & Flow (Elixir backend alignment)

**Status:** Read-only review done. Tickets to be created for frontend work.

**Sources (read-only):**
- `/Users/d9niel/_projects/cluiche-bord-elixir/specs/001-werewolf-engine/contracts/`
  - `README.md` – terminology (game type, variant, session), mock room `werewolf:room:mock`.
  - `rest-api.openapi.yaml` – REST: `/auth/guest`, `/rooms`, `/rooms/{id}/join`, etc.
  - `werewolf-channel.asyncapi.yaml` – Channel API (state, phase_change, start_game, night_action, day_vote, sheriff_action, hunter_shoot, advance).
  - `channel-events.md` – Human-readable Channel events (start_game, night_action, day_vote, sheriff_action, hunter_shoot, advance; server: state, phase_change, sheriff_elected, death_announcement, victory, role_action_result).
- `/Users/d9niel/_projects/cluiche-bord-elixir/docs/werewolf-flow.mmd` – Mermaid flowchart: night (wolves → witch → seer → hunter_check), sheriff (run → speech → final_withdraw → vote, tie handling), day (announce_deaths, last_word, speech, vote, hunter_shoot).

**Planned frontend tickets (parallelizable where deps allow):**
- **Auth & REST client:** Guest auth (POST /auth/guest), token storage, REST client for rooms (create, list, get, join, leave). Depends on: none. Can start once cleanup is done.
- **Channel client:** Phoenix Socket JS + channel `werewolf:room:{id}` and `werewolf:room:mock`, join/push/listen; types for state, phase_change, etc. from channel-events.md / AsyncAPI. Depends on: none.
- **Game state shape:** TypeScript types for `state` payload (phase, sub_phase, players, sheriff_id, pending_death, wolf_votes, wolf_locks, timer_ends_at, etc.) aligned with channel-events and flow. Depends on: Channel client ticket (or do in same ticket).
- **Screens per phase:** One ticket per major phase or group: e.g. “Lobby (room list, create, join, waiting room)”, “Night (wolves, witch, seer, hunter_check)”, “Sheriff (run, speech, final_withdraw, vote)”, “Day (announce_deaths, speech, vote, hunter_shoot)”. Each screen consumes state and dispatches the right Channel pushes. Depends on: Design tokens + components (ticket 02/03), Channel client + state shape.

**Tickets:** `tasks/ticket-04a-auth-rest-client.md`, `tasks/ticket-04b-channel-client.md`, `tasks/ticket-04c-game-state-types.md`, `tasks/ticket-04d-screens-*.md` (or one ticket-04-screens with sub-sections). Exact filenames TBD when creating the task files.

---

## 5. Non-blocking Issues & Open Decisions

(Items that could not be resolved after 2–3 reflections and need your input later.)

- **Next 16:** package.json currently has Next 15.3.2. You asked for “Next 16 + App Router”. If Next 16 is not yet released or we should stay on 15 for now, keep 15 and note “Upgrade to 16 when available” in report. *(Decision: stay on 15 until you confirm 16 version; cleanup will still remove Prisma/socket and prepare for 16.)*
- **i18n:** All spec screens are Chinese. No i18n strategy in spec. Recorded as gap; no change in this pass unless you request it.
- **E2E / Playwright:** Not in scope for this ticket set; can be a follow-up ticket after screens exist.
- **Next viewport:** Build warns "Unsupported metadata viewport is configured in metadata export". Move viewport to a dedicated `viewport` export per Next.js docs (non-blocking).
- **ESLint:** `PlayerListItem` uses `<img>` for avatar; Next suggests `next/image`. Non-blocking; can switch when optimizing.

---

## 6. Ticket Index

| ID | Title | Deps | Status |
|----|--------|------|--------|
| 00 | Cleanup: remove Prisma, API, socket-server, old src | - | Done |
| 01 | .openskills / Superpower usage report | - | Done (this report) |
| 02 | Design Tokens & Style Guide from spec/ | - | Done (draft) |
| 03 | Reusable components from spec/ | 02 | Done (merged) |
| 04a | Auth & REST client (guest, rooms) | 00 | Done (merged) |
| 04b | Phoenix Channel client (werewolf:room) | 00 | Done (merged) |
| 04c | Game state types (Channel state payload) | 04b | Done (merged) |
| 04d | Screens: Lobby, Night, Sheriff, Day (split or single) | 02, 03, 04b | Pending |

---

## 7. Subagent / Worktree Run (this session)

- **Progress:** `tasks/progress.md` created; worktrees at `.worktree/ticket-03`, `ticket-04a`, `ticket-04b`, `ticket-04c` (base: release/v0.1.0). Four subagents implemented 03, 04a, 04b, 04c with TDD; main agent committed in each worktree (subagents had not committed), then merged into release/v0.1.0 after code review.
- **Fixes during merge:** (1) Unified Vitest: single `vitest.config.mjs`, removed duplicate `vitest.config.ts` / `vitest.config.mts`; (2) Channel tests: Phoenix Socket uses `new transport(url)`, so tests use a `MockTransport` constructor instead of a factory; (3) Merged `src/test/setup.ts` (MockWebSocket + jest-dom); (4) Resolved package.json conflicts (scripts, deps); (5) React component tests need DOM: set `environment: "happy-dom"` so all tests (including .tsx) pass. Build and 53 tests pass.
- **For next time:** Ask subagents to run `git add -A && git commit -m "..."` in their worktree before returning, so merges are straightforward.

No blocking decisions required; all issues resolved with retries.

---

*Report will be updated as subagents complete work and new issues are found.*
