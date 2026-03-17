/**
 * Room domain model (from REST API Room, RoomListItem).
 */

export type GameStatus = "waiting" | "playing" | "finished";

export interface RoomPlayer {
  userId: string;
  nickname: string;
}

export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  gameId: string;
  variantId: string | null;
  hostUserId: string;
  players: RoomPlayer[];
  gameStatus: GameStatus;
  createdAt: string;
  lastActivity: string;
}

export interface RoomListItem {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  gameStatus: GameStatus;
  createdAt: string;
}

export function fromApiRoomListItem(api: {
  id: string;
  name: string;
  current_players: number;
  max_players: number;
  game_status: GameStatus;
  created_at: string;
}): RoomListItem {
  return {
    id: api.id,
    name: api.name,
    currentPlayers: api.current_players,
    maxPlayers: api.max_players,
    gameStatus: api.game_status,
    createdAt: api.created_at,
  };
}

export function fromApiRoom(api: {
  id: string;
  name: string;
  max_players: number;
  game_id: string;
  variant_id: string | null;
  host_user_id: string;
  players: Array<{ user_id: string; nickname: string }>;
  game_status: GameStatus;
  created_at: string;
  last_activity: string;
}): Room {
  return {
    id: api.id,
    name: api.name,
    maxPlayers: api.max_players,
    gameId: api.game_id,
    variantId: api.variant_id,
    hostUserId: api.host_user_id,
    players: api.players.map((p) => ({ userId: p.user_id, nickname: p.nickname })),
    gameStatus: api.game_status,
    createdAt: api.created_at,
    lastActivity: api.last_activity,
  };
}
