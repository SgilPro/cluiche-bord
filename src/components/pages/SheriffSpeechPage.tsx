"use client";

import { ChevronRight } from "lucide-react";
import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PlayerCardGrid from "@/components/ui/PlayerCardGrid";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function SheriffSpeechPage({
  state,
  onAction,
}: PhasePageProps) {
  const { day_number, sub_phase } = state;

  const isTieSpeech = sub_phase === "sheriff_tie_speech";

  // Fallback: show all alive players (candidates not in GameState yet)
  const alivePlayers = getAlivePlayers(state.players);

  const cards = alivePlayers.map((p) => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
  }));

  const handleAdvance = () => {
    onAction("advance", {});
  };

  return (
    <div
      className="flex min-h-screen flex-col pb-24"
      style={{ background: "var(--background-surface)" }}
    >
      <Header
        title={
          isTieSpeech
            ? `第 ${day_number} 天 · 平票重選發言`
            : `第 ${day_number} 天 · 警長競選發言`
        }
        variant="werewolf"
      />

      <NotificationBanner
        message={isTieSpeech ? "平票！候選人依序補充發言" : "候選人依序發言中"}
      />

      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        {/* Orange accent bar */}
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium"
          style={{
            background: "var(--accent-tertiary, #C17A30)",
            color: "#fff",
          }}
        >
          {isTieSpeech ? "平票重選：候選人補充發言" : "競選發言：候選人依序說明競選理由"}
        </div>

        <PlayerCardGrid cards={cards} disabled />
      </main>

      <ActionFooter
        variant="light"
        right={{
          label: "強制推進",
          icon: <ChevronRight size={16} />,
          onClick: handleAdvance,
        }}
      />
    </div>
  );
}
