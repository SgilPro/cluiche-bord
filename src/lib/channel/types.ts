/**
 * Minimal types for Werewolf channel events (full state shape in Ticket 04c).
 * Contract: channel-events.md
 */

export type Phase = "night" | "day";
export type SubPhase =
  | "role_reveal"
  | "night_opening"
  | "wolves"
  | "witch"
  | "seer"
  | "hunter_check"
  | "sheriff_run"
  | "sheriff_speech"
  | "sheriff_final_withdraw"
  | "sheriff_vote"
  | "sheriff_tie_speech"
  | "sheriff_tie_vote"
  | "announce_deaths"
  | "last_word"
  | "speech"
  | "vote"
  | "hunter_shoot"
  | "sheriff_handover"
  | "exile_tie_speech"
  | "exile_tie_vote";

export interface ChannelPlayer {
  id: string;
  nickname?: string | null;
  alive: boolean;
  role: "seer" | "witch" | "hunter" | "wolf" | "villager" | null;
  seat_index: number;
}

export interface ChannelGameState {
  phase: Phase;
  sub_phase: SubPhase;
  day_number: number;
  players: ChannelPlayer[];
  sheriff_id: string | null;
  pending_death: string | null;
  wolf_votes?: Record<string, string>;
  wolf_locks?: string[];
  timer_ends_at?: number;
  exile_tie_speech_current_id?: string | null;
}

export interface PhaseChangePayload {
  phase: Phase;
  sub_phase: SubPhase;
}

export interface SheriffElectedPayload {
  sheriff_id: string;
}

export interface DeathAnnouncementPayload {
  deaths: Array<{ player_id: string; cause: "wolf" | "poison" | "vote" }>;
}

export interface VictoryPayload {
  faction: "villagers" | "wolves";
}

export interface RoleActionResultPayload {
  result: "wolf" | "villager" | "no_kill";
  target_id: string;
}

/** Push event names (client -> server) */
export type WerewolfPushEvent =
  | "start_game"
  | "night_action"
  | "day_vote"
  | "sheriff_action"
  | "hunter_shoot"
  | "advance";

/** Broadcast/push event names (server -> client) */
export type WerewolfChannelEvent =
  | "state"
  | "phase_change"
  | "sheriff_elected"
  | "death_announcement"
  | "victory"
  | "role_action_result"
  | "vote_tie"
  | "vote_no_exile";

export interface VoteTiePayload {
  /** Player IDs that were tied */
  tied_ids: string[];
}

export interface VoteNoExilePayload {
  reason: "tie" | "no_majority";
}
