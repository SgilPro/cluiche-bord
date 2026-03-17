/**
 * Domain models – canonical app types mapped from API responses.
 * Use these in UI and business logic; API client returns raw API shapes.
 */

export type { GameStatus, Room, RoomPlayer, RoomListItem } from "./room";
export { fromApiRoom, fromApiRoomListItem } from "./room";

export type { Guest } from "./guest";
export { fromApiGuest } from "./guest";

export type { GameType, GameVariant } from "./game";
export { fromApiGameType, fromApiGameVariant } from "./game";
