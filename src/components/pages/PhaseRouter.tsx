"use client";

import type { GameState, SubPhase } from "@/lib/games/werewolf/types";
import type { WerewolfPushEvent } from "@/lib/channel";
import {
  DayAnnounceDeathsPage,
  DaySpeechPage,
  DayVotePage,
  HunterShootPage,
  NightHunterCheckPage,
  NightSeerPage,
  NightWitchPage,
  NightWolvesPage,
  SheriffFinalWithdrawPage,
  SheriffRunPage,
  SheriffSpeechPage,
  SheriffVotePage,
} from "./index";
import type { PhasePageProps } from "./phase-types";

interface PhaseRouterProps {
  state: GameState;
  roomId: string;
  myPlayerId: string;
  onAction: (event: WerewolfPushEvent, payload: Record<string, unknown>) => void;
}

function PlaceholderPhasePage({
  state,
  roomId,
  subPhase,
}: PhasePageProps & { subPhase: SubPhase }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background-primary)] px-4">
      <h1 className="text-xl font-bold text-[var(--text-on-dark)]">
        階段：{state.phase} / {subPhase}
      </h1>
      <p className="text-[var(--text-secondary)]">
        房間 {roomId} · 第 {state.day_number} 輪
      </p>
    </div>
  );
}

export default function PhaseRouter({ state, roomId, myPlayerId, onAction }: PhaseRouterProps) {
  const props: PhasePageProps = { state, roomId, myPlayerId, onAction };
  const { phase, sub_phase } = state;

  if (phase === "night") {
    switch (sub_phase) {
      case "wolves":
        return <NightWolvesPage {...props} />;
      case "witch":
        return <NightWitchPage {...props} />;
      case "seer":
        return <NightSeerPage {...props} />;
      case "hunter_check":
        return <NightHunterCheckPage {...props} />;
      default:
        return <PlaceholderPhasePage {...props} subPhase={sub_phase} />;
    }
  }

  if (phase === "day") {
    switch (sub_phase) {
      case "sheriff_run":
        return <SheriffRunPage {...props} />;
      case "sheriff_speech":
      case "sheriff_tie_speech":
        return <SheriffSpeechPage {...props} />;
      case "sheriff_final_withdraw":
        return <SheriffFinalWithdrawPage {...props} />;
      case "sheriff_vote":
      case "sheriff_tie_vote":
        return <SheriffVotePage {...props} />;
      case "announce_deaths":
        return <DayAnnounceDeathsPage {...props} />;
      case "speech":
        return <DaySpeechPage {...props} />;
      case "vote":
        return <DayVotePage {...props} />;
      case "hunter_shoot":
        return <HunterShootPage {...props} />;
      case "last_word":
      case "sheriff_handover":
      default:
        return <PlaceholderPhasePage {...props} subPhase={sub_phase} />;
    }
  }

  return <PlaceholderPhasePage {...props} subPhase={sub_phase} />;
}
