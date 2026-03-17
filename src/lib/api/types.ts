/**
 * REST API types from OpenAPI spec (rest-api.openapi.yaml).
 * Room id: 6-char alphanumeric (pattern ^[A-Za-z0-9]{6}$).
 */

export type GameStatus = "waiting" | "playing" | "finished";

export interface RoomPlayer {
  user_id: string;
  nickname: string;
}

export interface Room {
  id: string;
  name: string;
  max_players: number;
  game_id: string;
  variant_id: string | null;
  host_user_id: string;
  players: RoomPlayer[];
  game_status: GameStatus;
  created_at: string;
  last_activity: string;
}

export interface RoomListItem {
  id: string;
  name: string;
  current_players: number;
  max_players: number;
  game_status: GameStatus;
  created_at: string;
}

export interface ListRoomsResponse {
  rooms: RoomListItem[];
}

/** POST /api/auth/guest response */
export interface GuestAuthResponse {
  token: string;
  user_id: string;
  nickname: string | null;
}

/** POST /api/rooms request body */
export interface CreateRoomBody {
  name?: string;
  max_players?: number;
  game_id?: string;
  variant_id?: string;
}

/** POST /api/rooms/{id}/join request body */
export interface JoinRoomBody {
  nickname?: string;
}

/** POST /api/rooms/{id}/join response */
export interface JoinRoomResponse {
  success: boolean;
  room: Room;
}
