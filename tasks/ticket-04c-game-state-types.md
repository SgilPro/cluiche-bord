# Ticket 04c: Game State Types (Channel state payload)

**Goal:** TypeScript types for the Channel `state` event and related payloads, aligned with backend contract.

## Contract (read-only)

- **Source:** `cluiche-bord-elixir/specs/001-werewolf-engine/contracts/channel-events.md` (TypeScript hints + payloads)
- **Flow:** `docs/werewolf-flow.mmd` for phase/sub_phase values.

## Tasks

1. Define types (e.g. in `src/lib/games/werewolf/types.ts` or `src/types/werewolf.ts`):
   - `Phase`, `SubPhase` (night: wolves, witch, seer, hunter_check; day: sheriff_run, sheriff_speech, ..., announce_deaths, last_word, speech, vote, hunter_shoot, etc.)
   - `Player`: id, alive, role, seat_index (role visible only to self/wolves)
   - `GameState`: phase, sub_phase, day_number, players, sheriff_id, pending_death, wolf_votes, wolf_locks, timer_ends_at, last_word_*
   - Event payloads: `state`, `phase_change`, `sheriff_elected`, `death_announcement`, `victory`, `role_action_result`
2. Export from a single module for use by Channel client and UI.

## Acceptance

- Types match channel-events.md and werewolf-flow.mmd.
- No Prisma or socket-server types; only Channel/engine types.
