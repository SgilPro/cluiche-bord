/**
 * Contract tests for werewolf channel state types.
 * Fixtures match cluiche-bord-elixir/specs/001-werewolf-engine/contracts/channel-events.md
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import {
  type Phase,
  type SubPhase,
  type Player,
  type GameState,
  type StatePayload,
  type PhaseChangePayload,
  type SheriffElectedPayload,
  type DeathAnnouncementPayload,
  type VictoryPayload,
  type RoleActionResultPayload,
  type DeathCause,
  type RoleId,
  isPhase,
  isSubPhase,
  isPlayer,
  isGameState,
} from "./types";

// --- Contract fixtures from channel-events.md ---

const statePayloadFromContract = {
  phase: "night" as const,
  sub_phase: "witch" as const,
  day_number: 1,
  players: [
    { id: "p1", alive: true, role: "wolf" as const, seat_index: 0 },
    { id: "p2", alive: true, role: null, seat_index: 1 },
  ],
  sheriff_id: "p1",
  pending_death: "p3",
  wolf_votes: { p1: "p3", p2: "p3", p3: "pass" },
  wolf_locks: ["p1", "p2", "p3"],
  timer_ends_at: 1739548800,
};

const phaseChangePayload = {
  phase: "night" as const,
  sub_phase: "witch" as const,
};

const sheriffElectedPayload = { sheriff_id: "p3" };

const deathAnnouncementPayload = {
  deaths: [
    { player_id: "p3", cause: "wolf" as const },
    { player_id: "p4", cause: "poison" as const },
  ],
};

const victoryPayload = { faction: "villagers" as const };

const roleActionResultPayload = {
  result: "wolf" as const,
  target_id: "p5",
};

describe("werewolf types (channel contract)", () => {
  describe("expectTypeOf contract payloads", () => {
    it("state payload matches GameState / StatePayload", () => {
      expectTypeOf(statePayloadFromContract).toMatchTypeOf<GameState>();
      expectTypeOf(statePayloadFromContract).toMatchTypeOf<StatePayload>();
    });

    it("phase_change payload matches PhaseChangePayload", () => {
      expectTypeOf(phaseChangePayload).toMatchTypeOf<PhaseChangePayload>();
    });

    it("sheriff_elected payload matches SheriffElectedPayload", () => {
      expectTypeOf(sheriffElectedPayload).toMatchTypeOf<SheriffElectedPayload>();
    });

    it("death_announcement payload matches DeathAnnouncementPayload", () => {
      expectTypeOf(deathAnnouncementPayload).toMatchTypeOf<DeathAnnouncementPayload>();
    });

    it("victory payload matches VictoryPayload", () => {
      expectTypeOf(victoryPayload).toMatchTypeOf<VictoryPayload>();
    });

    it("role_action_result payload matches RoleActionResultPayload", () => {
      expectTypeOf(roleActionResultPayload).toMatchTypeOf<RoleActionResultPayload>();
    });

    it("Phase is night | day", () => {
      expectTypeOf<Phase>().toEqualTypeOf<"night" | "day">();
    });

    it("SubPhase includes all contract values", () => {
      type Check =
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
        | "sheriff_handover";
      expectTypeOf<SubPhase>().toMatchTypeOf<Check>();
      expectTypeOf<Check>().toMatchTypeOf<SubPhase>();
    });

    it("Player has id, alive, role, seat_index", () => {
      expectTypeOf<Player>().toHaveProperty("id").toEqualTypeOf<string>();
      expectTypeOf<Player>().toHaveProperty("alive").toEqualTypeOf<boolean>();
      expectTypeOf<Player>().toHaveProperty("role").toEqualTypeOf<RoleId | null>();
      expectTypeOf<Player>().toHaveProperty("seat_index").toEqualTypeOf<number>();
    });

    it("GameState has required fields", () => {
      expectTypeOf<GameState>().toHaveProperty("phase").toEqualTypeOf<Phase>();
      expectTypeOf<GameState>().toHaveProperty("sub_phase").toEqualTypeOf<SubPhase>();
      expectTypeOf<GameState>().toHaveProperty("day_number").toEqualTypeOf<number>();
      expectTypeOf<GameState>().toHaveProperty("players").toEqualTypeOf<Player[]>();
      expectTypeOf<GameState>().toHaveProperty("sheriff_id").toEqualTypeOf<string | null>();
      expectTypeOf<GameState>().toHaveProperty("pending_death").toEqualTypeOf<string | null>();
    });

    it("DeathCause is wolf | poison | vote", () => {
      expectTypeOf<DeathCause>().toEqualTypeOf<"wolf" | "poison" | "vote">();
    });
  });

  describe("type guards", () => {
    it("isPhase accepts night and day", () => {
      expect(isPhase("night")).toBe(true);
      expect(isPhase("day")).toBe(true);
    });

    it("isPhase rejects invalid", () => {
      expect(isPhase("")).toBe(false);
      expect(isPhase("nighth")).toBe(false);
      expect(isPhase(null)).toBe(false);
      expect(isPhase(1)).toBe(false);
    });

    it("isSubPhase accepts contract sub_phases", () => {
      expect(isSubPhase("wolves")).toBe(true);
      expect(isSubPhase("witch")).toBe(true);
      expect(isSubPhase("seer")).toBe(true);
      expect(isSubPhase("hunter_check")).toBe(true);
      expect(isSubPhase("sheriff_run")).toBe(true);
      expect(isSubPhase("announce_deaths")).toBe(true);
      expect(isSubPhase("speech")).toBe(true);
      expect(isSubPhase("vote")).toBe(true);
      expect(isSubPhase("hunter_shoot")).toBe(true);
      expect(isSubPhase("sheriff_handover")).toBe(true);
    });

    it("isSubPhase rejects invalid", () => {
      expect(isSubPhase("")).toBe(false);
      expect(isSubPhase("invalid")).toBe(false);
    });

    it("isSubPhase accepts exile_tie_speech", () => {
      expect(isSubPhase("exile_tie_speech")).toBe(true);
    });

    it("isSubPhase accepts exile_tie_vote", () => {
      expect(isSubPhase("exile_tie_vote")).toBe(true);
    });

    it("isPlayer accepts valid player shape", () => {
      expect(isPlayer({ id: "p1", alive: true, role: "wolf", seat_index: 0 })).toBe(true);
      expect(isPlayer({ id: "p2", alive: false, role: null, seat_index: 1 })).toBe(true);
    });

    it("isPlayer rejects invalid", () => {
      expect(isPlayer(null)).toBe(false);
      expect(isPlayer({})).toBe(false);
      expect(isPlayer({ id: "p1", alive: true, seat_index: 0 })).toBe(false); // missing role
    });

    it("isGameState accepts valid state shape", () => {
      expect(isGameState(statePayloadFromContract)).toBe(true);
    });

    it("isGameState rejects invalid", () => {
      expect(isGameState(null)).toBe(false);
      expect(isGameState({})).toBe(false);
      expect(isGameState({ ...statePayloadFromContract, phase: "invalid" })).toBe(false);
    });
  });
});
