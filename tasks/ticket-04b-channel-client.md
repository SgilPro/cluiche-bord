# Ticket 04b: Phoenix Channel Client (werewolf:room)

**Goal:** Connect to Elixir backend via Phoenix Channel for game session (and mock room).

## Contract (read-only)

- **Source:** `cluiche-bord-elixir/specs/001-werewolf-engine/contracts/README.md`, `channel-events.md`, `werewolf-channel.asyncapi.yaml`
- **URL:** `ws://localhost:4000/socket/websocket?token=<user_token>&vsn=2.0.0` (or env for deployed).
- **Topic:** `werewolf:room:{room_id}` or `werewolf:room:mock` for fixture.
- **Join:** channel.join(); then push/listen as per channel-events.md.

## Tasks

1. Add Phoenix Socket client (e.g. `phoenix` or `phoenix-channel` npm package, or use vanilla WebSocket with Phoenix protocol if preferred).
2. Implement connection with token in query params; join topic `werewolf:room:{roomId}` or `werewolf:room:mock`.
3. Expose: push `start_game`, `night_action`, `day_vote`, `sheriff_action`, `hunter_shoot`, `advance` (for dev); listen for `state`, `phase_change`, `sheriff_elected`, `death_announcement`, `victory`, `role_action_result`.
4. Types for payloads can be minimal here; full state shape in Ticket 04c.

## Acceptance

- Can connect and join `werewolf:room:mock`, receive `state` event.
- Can push `start_game` (with mock payload) and get reply.
- No dependency on Prisma or old socket-server.
