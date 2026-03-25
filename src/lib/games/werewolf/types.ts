/**
 * Werewolf game state types for Channel state event and related payloads.
 * Aligned with: cluiche-bord-elixir/specs/001-werewolf-engine/contracts/channel-events.md
 * Flow: docs/werewolf-flow.mmd (phase / sub_phase values).
 */

// --- Phase & SubPhase (werewolf-flow.mmd + channel-events.md) ---

export type Phase = "night" | "day";

export const PHASES: Phase[] = ["night", "day"];

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

export const SUB_PHASES: SubPhase[] = [
  "role_reveal",
  "night_opening",
  "wolves",
  "witch",
  "seer",
  "hunter_check",
  "sheriff_run",
  "sheriff_speech",
  "sheriff_final_withdraw",
  "sheriff_vote",
  "sheriff_tie_speech",
  "sheriff_tie_vote",
  "announce_deaths",
  "last_word",
  "speech",
  "vote",
  "hunter_shoot",
  "sheriff_handover",
  "exile_tie_speech",
  "exile_tie_vote",
];

// --- Role (contract: role visible only to self / wolves) ---

export type RoleId = "seer" | "witch" | "hunter" | "wolf" | "villager";

// --- Player ---

export interface Player {
  id: string;
  /** Populated by backend. Fallback to seat label when absent. */
  nickname?: string;
  alive: boolean;
  role: RoleId | null;
  seat_index: number;
}

// --- GameState (state event payload) ---

export interface GameState {
  phase: Phase;
  sub_phase: SubPhase;
  day_number: number;
  players: Player[];
  sheriff_id: string | null;
  pending_death: string | null;
  wolf_votes?: Record<string, string>;
  wolf_locks?: string[];
  timer_ends_at?: number;
  last_word_ids?: string[];
  last_word_index?: number;
  last_word_current_id?: string | null;
  exile_tie_speech_current_id?: string | null;
}

// State event payload is the full game state
export type StatePayload = GameState;

// --- Server → Client event payloads ---

export interface PhaseChangePayload {
  phase: Phase;
  sub_phase: SubPhase;
}

export interface SheriffElectedPayload {
  sheriff_id: string;
}

export type DeathCause = "wolf" | "poison" | "vote";

export interface DeathEntry {
  player_id: string;
  cause: DeathCause;
}

export interface DeathAnnouncementPayload {
  deaths: DeathEntry[];
}

export type VictoryFaction = "villagers" | "wolves";

export interface VictoryPayload {
  faction: VictoryFaction;
}

export type RoleActionResultKind = "wolf" | "villager" | "no_kill";

export interface RoleActionResultPayload {
  result: RoleActionResultKind;
  target_id: string;
}

// --- Type guards ---

export function isPhase(x: unknown): x is Phase {
  return typeof x === "string" && (x === "night" || x === "day");
}

export function isSubPhase(x: unknown): x is SubPhase {
  return typeof x === "string" && SUB_PHASES.includes(x as SubPhase);
}

export function isPlayer(x: unknown): x is Player {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.alive === "boolean" &&
    (o.role === null ||
      (typeof o.role === "string" &&
        ["seer", "witch", "hunter", "wolf", "villager"].includes(o.role))) &&
    typeof o.seat_index === "number"
  );
}

export function isGameState(x: unknown): x is GameState {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    isPhase(o.phase) &&
    isSubPhase(o.sub_phase) &&
    typeof o.day_number === "number" &&
    Array.isArray(o.players) &&
    o.players.every(isPlayer) &&
    (o.sheriff_id === null || typeof o.sheriff_id === "string") &&
    (o.pending_death === null || typeof o.pending_death === "string")
  );
}
