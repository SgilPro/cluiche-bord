"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PhaseRouter from "@/components/pages/PhaseRouter";
import NotificationBanner from "@/components/ui/NotificationBanner";
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

/** Overlay transition screens triggered by phase_change (timer-based) */
type TransitionScreen = "day_opening" | "sheriff_opening" | null;

export default function GameRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [victoryFaction, setVictoryFaction] = useState<VictoryFaction | null>(null);
  const [transitionScreen, setTransitionScreen] = useState<TransitionScreen>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>("");
  const [voteNotice, setVoteNotice] = useState<"tie" | "no_exile" | null>(null);

  /** Keep a ref to the channel so callbacks don't capture stale closures */
  const channelRef = useRef<WerewolfChannelApi | null>(null);
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
        // Full game state broadcast – role_reveal / night_opening driven by sub_phase
        ch.on("state", (payload) => {
          setGameState(payload as GameState);
          setVoteNotice(null);
        });

        // Phase change: manage timer-based transition screens for day/sheriff openings
        ch.on("phase_change", (payload) => {
          const { phase, sub_phase } = payload as { phase: string; sub_phase: string };

          // Day announce_deaths opening (~10s splash)
          if (phase === "day" && sub_phase === "announce_deaths") {
            setTransitionScreen("day_opening");
            clearTransitionAfter(10_000);
            return;
          }

          // Sheriff run opening (~8s splash)
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

        // Vote resolution notices (clears automatically when next state arrives)
        ch.on("vote_tie", () => setVoteNotice("tie"));
        ch.on("vote_no_exile", () => setVoteNotice("no_exile"));
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

  // role_reveal and night_opening are driven directly by state.sub_phase (backend-controlled)
  if (gameState?.sub_phase === "role_reveal") {
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    const role = myPlayer?.role ?? "villager";
    const isHost = gameState.players[0]?.id === myPlayerId;
    return (
      <RoleRevealScreen
        role={role}
        timerEndsAt={gameState.timer_ends_at}
        isHost={isHost}
        onAdvance={() => onAction("advance", {})}
      />
    );
  }

  if (gameState?.sub_phase === "night_opening") {
    const isHost = gameState.players[0]?.id === myPlayerId;
    return (
      <NightOpeningScreen
        dayNumber={gameState.day_number}
        timerEndsAt={gameState.timer_ends_at}
        isHost={isHost}
        onAdvance={() => onAction("advance", {})}
      />
    );
  }

  // Timer-based transition screens for day/sheriff openings
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
    <>
      {voteNotice === "tie" && (
        <NotificationBanner message="投票平票！進入追加發言投票流程" />
      )}
      {voteNotice === "no_exile" && (
        <NotificationBanner message="平票無解，本回合無人出局" />
      )}
      <PhaseRouter
        state={gameState}
        roomId={roomId}
        myPlayerId={myPlayerId}
        onAction={onAction}
      />
    </>
  );
}
