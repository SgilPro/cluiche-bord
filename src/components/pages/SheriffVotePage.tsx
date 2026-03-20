"use client";

import { useState } from "react";
import { ChevronRight, Crown } from "lucide-react";
import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PlayerCardGrid from "@/components/ui/PlayerCardGrid";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function SheriffVotePage({
  state,
  onAction,
}: PhasePageProps) {
  const { day_number, sub_phase, sheriff_id } = state;

  const isTieVote = sub_phase === "sheriff_tie_vote";

  // Fallback: show all alive players (candidates not explicitly in GameState)
  const alivePlayers = getAlivePlayers(state.players);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cards = alivePlayers.map((p) => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
    isSelected: p.id === selectedId,
    badge:
      p.id === sheriff_id ? (
        <Crown size={14} style={{ color: "var(--accent-tertiary, #C17A30)" }} />
      ) : undefined,
  }));

  const handleSelect = (playerId: string) => {
    setSelectedId((prev) => (prev === playerId ? null : playerId));
  };

  const handleConfirmVote = () => {
    if (!selectedId) return;
    onAction("sheriff_action", { action: "vote", target_id: selectedId });
  };

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
          isTieVote
            ? `第 ${day_number} 天 · 平票重選`
            : `第 ${day_number} 天 · 警長投票`
        }
        variant="werewolf"
      />

      <NotificationBanner
        message={isTieVote ? "平票重選！請再次投票選出警長" : "請投票選出警長"}
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
          {isTieVote ? "平票重選：請從候選人中投出警長" : "警長投票：點選候選人進行投票"}
        </div>

        <PlayerCardGrid cards={cards} onSelect={handleSelect} />
      </main>

      <ActionFooter
        variant="light"
        left={{
          label: "強制推進",
          icon: <ChevronRight size={16} />,
          onClick: handleAdvance,
        }}
        right={{
          label: "確認投票",
          icon: <Crown size={16} />,
          onClick: handleConfirmVote,
          disabled: !selectedId,
        }}
      />
    </div>
  );
}
