"use client";

import PhaseRouter from "@/components/pages/PhaseRouter";
import type { GameState } from "@/lib/games/werewolf/types";
import { useParams } from "next/navigation";
import { useMemo } from "react";

/** Mock game state for development. Replace with Channel state when connected. */
function createMockState(overrides?: Partial<GameState>): GameState {
  const players = Array.from({ length: 6 }, (_, i) => ({
    id: `player-${i}`,
    alive: true,
    role: null,
    seat_index: i,
  }));

  return {
    phase: "night",
    sub_phase: "wolves",
    day_number: 1,
    players,
    sheriff_id: null,
    pending_death: null,
    ...overrides,
  };
}

export default function GameRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const mockState = useMemo(
    () =>
      createMockState({
        phase: "night",
        sub_phase: "wolves",
      }),
    [],
  );

  return (
    <PhaseRouter state={mockState} roomId={roomId} />
  );
}
