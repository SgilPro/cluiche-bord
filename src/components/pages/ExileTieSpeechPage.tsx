"use client";

import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PlayerCardGrid from "@/components/ui/PlayerCardGrid";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function ExileTieSpeechPage({ state, myPlayerId, onAction }: PhasePageProps) {
  const { day_number, exile_tie_speech_current_id } = state;
  const isHost = state.players[0]?.id === myPlayerId;
  const alive = getAlivePlayers(state.players);

  const currentSpeaker = alive.find((p) => p.id === exile_tie_speech_current_id) ?? null;

  const cards = alive.map((p) => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
    isCurrentTarget: p.id === exile_tie_speech_current_id,
  }));

  const speakerLabel = currentSpeaker
    ? `「${currentSpeaker.nickname ?? `座位 ${currentSpeaker.seat_index + 1}`}」正在發言`
    : "等待發言者...";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header title={`第 ${day_number} 天 · 平票發言`} variant="werewolf" />
      <NotificationBanner message={speakerLabel} />
      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        <PlayerCardGrid cards={cards} disabled />
      </main>
      {isHost && (
        <ActionFooter
          variant="light"
          right={{ label: "強制推進", onClick: () => onAction("advance", {}) }}
        />
      )}
    </div>
  );
}
