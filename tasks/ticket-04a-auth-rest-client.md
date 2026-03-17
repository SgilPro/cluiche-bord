# Ticket 04a: Auth & REST Client

**Goal:** Frontend auth (guest) and REST client for rooms, aligned with Elixir backend.

## Contract (read-only)

- **Source:** `cluiche-bord-elixir/specs/001-werewolf-engine/contracts/rest-api.openapi.yaml`
- **Auth:** POST `/api/auth/guest` → `{ token, user_id, nickname? }`. Optional `device_id` (UUID) for persistence. Use token in `Authorization: Bearer <token>`.
- **Rooms:** POST `/api/rooms` (create), GET `/api/rooms` (list, optional `game_id`, `limit`), GET `/api/rooms/{id}` (get), POST `/api/rooms/{id}/join` (join). Auth required for create/join.

## Tasks

1. Implement a small API client (e.g. `src/lib/api/client.ts`) that:
   - Calls backend at configurable origin (e.g. `NEXT_PUBLIC_API_ORIGIN=http://localhost:4000`).
   - Sends `Authorization: Bearer <token>` when token exists.
2. Implement guest auth: create guest (optionally with `device_id`), store token (e.g. in memory or secure storage for now), expose `user_id` / `nickname` for UI.
3. Implement room API: createRoom, listRooms, getRoom, joinRoom (and leave if in OpenAPI).
4. Add TypeScript types for REST responses (Room, RoomListItem, etc.) from OpenAPI or channel-events README.

## Acceptance

- Can create guest and get token.
- Can create room, list rooms, get room, join room with that token.
- No Prisma or socket.io in this client.
