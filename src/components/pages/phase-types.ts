/**
 * Shared props for phase page components.
 * Each phase component receives GameState (or slice) and callbacks.
 */

import type { GameState, Player } from "@/lib/games/werewolf/types";

export interface PhasePageProps {
  state: GameState;
  roomId: string;
}

export interface NightActionPayload {
  target_id?: string;
  item?: "antidote" | "poison" | "none";
  skip?: boolean;
}

export interface DayVotePayload {
  target_id: string;
}

export interface PhaseCallbacks {
  night_action?: (payload: NightActionPayload) => void;
  day_vote?: (payload: DayVotePayload) => void;
}

/** Get alive players only */
export function getAlivePlayers(players: Player[]): Player[] {
  return players.filter((p) => p.alive);
}
