# Ticket 04d: Screens (Lobby, Night, Sheriff, Day)

**Goal:** Implement main app screens that consume game state and dispatch Channel pushes, using Design Tokens + components (02, 03) and Channel client + state types (04b, 04c).

## Prerequisites

- Ticket 02 (Design Tokens & Style Guide)
- Ticket 03 (Reusable components)
- Ticket 04b (Channel client)
- Ticket 04c (Game state types)
- Optional: 04a (Auth & REST) for room list/create/join

## Screens to implement

1. **Lobby**
   - Room list (from REST or mock), create room, join room.
   - Waiting room: show players, “start game” for host; join link/code if in spec.
2. **Night**
   - Sub-phases: wolves (vote/lock), witch (save/poison/pass), seer (inspect), hunter_check (confirm).
   - Show only the current sub-phase UI for the current player’s role; hide others’ actions.
3. **Sheriff (day 1)**
   - sheriff_run, sheriff_speech, sheriff_final_withdraw, sheriff_vote, sheriff_tie_*.
   - Host can force advance where allowed by contract.
4. **Day**
   - announce_deaths, last_word, speech order, vote (exile), hunter_shoot (if applicable).
   - Show phase title and timer if present in state.

Each screen should:
- Read `GameState` (and optional auth context).
- Render using shared components and design tokens.
- Push the correct Channel events for user actions (night_action, day_vote, sheriff_action, hunter_shoot, advance).

## Acceptance

- Can run through mock room flow: join → start_game → night phases → sheriff → day phases.
- UI matches spec as per components; no Prisma/socket-server.

## Note

Can be split into 04d1-lobby, 04d2-night, 04d3-sheriff, 04d4-day if parallelizing; then 04d depends on 02, 03, 04b, 04c.
