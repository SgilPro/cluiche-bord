/**
 * Test live REST API calls against Elixir backend.
 * Usage: NEXT_PUBLIC_API_ORIGIN=https://cluiche-bord.zeabur.app npx tsx scripts/test-api.ts
 * Or with .env: ensure NEXT_PUBLIC_API_ORIGIN is set, then npx tsx scripts/test-api.ts
 */

// Load .env.local / .env if available (Node doesn't auto-load for scripts)
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import {
  createGuest,
  getRoom,
  listGameTypes,
  listGameVariants,
  listRooms,
} from "../src/lib/api/client";
import {
  fromApiGameType,
  fromApiGameVariant,
  fromApiGuest,
  fromApiRoom,
  fromApiRoomListItem,
} from "../src/lib/domain";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "https://cluiche-bord.zeabur.app";
process.env.NEXT_PUBLIC_API_ORIGIN = API_ORIGIN;

async function main() {
  console.log("Testing API at:", API_ORIGIN);
  console.log("");

  try {
    // 1. Guest auth (no auth required)
    console.log("1. POST /api/auth/guest");
    const authRes = await createGuest(undefined, "TestPlayer");
    const guest = fromApiGuest(authRes);
    console.log("   OK – guest:", { userId: guest.userId, nickname: guest.nickname });
    console.log("");

    // 2. List game types
    console.log("2. GET /api/games");
    const gamesRes = await listGameTypes();
    const games = gamesRes.games.map(fromApiGameType);
    console.log("   OK – games:", games.length, games.map((g) => g.name).join(", ") || "(none)");
    if (games.length === 0) {
      console.log("   (No games in catalog; skipping game_variants test)");
    } else {
      const firstGame = games[0];
      console.log("");
      console.log("3. GET /api/game_variants?game_id=" + firstGame.id);
      const variantsRes = await listGameVariants({ game_id: firstGame.id });
      const variants = variantsRes.variants.map(fromApiGameVariant);
      console.log("   OK – variants:", variants.length, variants.map((v) => v.name).join(", ") || "(none)");
    }
    console.log("");

    // 4. List rooms
    console.log("4. GET /api/rooms");
    const roomsRes = await listRooms({ limit: 5 });
    const rooms = roomsRes.rooms.map(fromApiRoomListItem);
    console.log("   OK – rooms:", rooms.length);
    rooms.forEach((r) =>
      console.log("      -", r.id, r.name, `${r.currentPlayers}/${r.maxPlayers}`, r.gameStatus)
    );
    console.log("");

    // 5. Get single room (if any)
    if (rooms.length > 0) {
      const roomId = rooms[0].id;
      console.log("5. GET /api/rooms/" + roomId);
      const roomRes = await getRoom(roomId);
      const room = fromApiRoom(roomRes);
      console.log("   OK – room:", room.name, "host:", room.hostUserId);
    }

    console.log("");
    console.log("All API calls succeeded.");
  } catch (err) {
    console.error("API error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
