"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PhaseRouter from "@/components/pages/PhaseRouter";
import {
  VictoryPage,
  RoleRevealScreen,
  NightOpeningScreen,
  DayOpeningScreen,
  SheriffOpeningScreen,
} from "@/components/pages";
import type { GameState, VictoryFaction } from "@/lib/games/werewolf/types";
import type { WerewolfChannelApi, WerewolfPushEvent } from "@/lib/channel";
import { createWerewolfChannel } from "@/lib/channel";
import { getApiOrigin, getToken, getUserId } from "@/lib/api";

/** Opening/transition screens managed by the game page */
type TransitionScreen =
  | "role_reveal"
  | "night_opening"
  | "day_opening"
  | "sheriff_opening"
  | null;

export default function GameRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [victoryFaction, setVictoryFaction] = useState<VictoryFaction | null>(null);
  const [transitionScreen, setTransitionScreen] = useState<TransitionScreen>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>("");

  /** Keep a ref to the channel so callbacks don't capture stale closures */
  const channelRef = useRef<WerewolfChannelApi | null>(null);
  /** Track whether the first night has been handled already */
  const seenFirstNightRef = useRef(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTransitionAfter = useCallback((ms: number) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => {
      setTransitionScreen(null);
    }, ms);
  }, []);

  useEffect(() => {
    const userId = getUserId();
    setMyPlayerId(userId ?? "");

    const token = getToken();
    if (!token) {
      console.error("[GameRoomPage] No guest token found – cannot join channel");
      return;
    }

    const origin = getApiOrigin();
    // Convert HTTP(S) origin to WS(S) for Phoenix Socket
    const wsUrl = origin.replace(/^https/, "wss").replace(/^http/, "ws") + "/socket";

    const ch = createWerewolfChannel({ url: wsUrl, token });
    channelRef.current = ch;

    ch.connect()
      .then(() => ch.join(roomId))
      .then(() => {
        // Full game state broadcast
        ch.on("state", (payload) => {
          const state = payload as GameState;
          setGameState(state);

          // First night: show role reveal (5s) → night opening (10s) → clear
          if (
            state.phase === "night" &&
            state.sub_phase === "wolves" &&
            state.day_number === 1 &&
            !seenFirstNightRef.current
          ) {
            seenFirstNightRef.current = true;
            setTransitionScreen("role_reveal");
            if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = setTimeout(() => {
              setTransitionScreen("night_opening");
              clearTransitionAfter(10_000);
            }, 5_000);
          }
        });

        // Phase change: manage transition screens for subsequent phases
        ch.on("phase_change", (payload) => {
          const { phase, sub_phase } = payload as { phase: string; sub_phase: string };

          // Subsequent nights (first night is handled via state event above)
          if (phase === "night" && seenFirstNightRef.current) {
            setTransitionScreen("night_opening");
            clearTransitionAfter(10_000);
            return;
          }

          // Day announce_deaths opening
          if (phase === "day" && sub_phase === "announce_deaths") {
            setTransitionScreen("day_opening");
            clearTransitionAfter(10_000);
            return;
          }

          // Sheriff run opening
          if (sub_phase === "sheriff_run") {
            setTransitionScreen("sheriff_opening");
            clearTransitionAfter(8_000);
            return;
          }
        });

        // Game over
        ch.on("victory", (payload) => {
          const { faction } = payload as { faction: VictoryFaction };
          setVictoryFaction(faction);
        });
      })
      .catch((err: unknown) => {
        console.error("[GameRoomPage] Channel connection failed:", err);
      });

    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      ch.disconnect();
      channelRef.current = null;
    };
    // roomId is stable for the life of this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const onAction = useCallback(
    (event: WerewolfPushEvent, payload: Record<string, unknown>) => {
      channelRef.current
        ?.push(event, payload)
        .catch((err: unknown) =>
          console.error(`[GameRoomPage] push ${event} failed:`, err),
        );
    },
    [],
  );

  // --- Render ---

  if (victoryFaction && gameState) {
    return <VictoryPage faction={victoryFaction} players={gameState.players} />;
  }

  // Opening transition screens
  if (transitionScreen === "role_reveal" && gameState) {
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    const role = myPlayer?.role ?? "villager";
    return <RoleRevealScreen role={role} />;
  }

  if (transitionScreen === "night_opening" && gameState) {
    return <NightOpeningScreen dayNumber={gameState.day_number} />;
  }

  if (transitionScreen === "day_opening" && gameState) {
    return <DayOpeningScreen dayNumber={gameState.day_number} />;
  }

  if (transitionScreen === "sheriff_opening" && gameState) {
    return <SheriffOpeningScreen dayNumber={gameState.day_number} />;
  }

  // Connecting / waiting for first state
  if (!gameState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background-primary)]">
        <p className="text-[var(--text-secondary)]">連線中…</p>
      </div>
    );
  }

  return (
    <PhaseRouter
      state={gameState}
      roomId={roomId}
      myPlayerId={myPlayerId}
      onAction={onAction}
    />
  );
}
