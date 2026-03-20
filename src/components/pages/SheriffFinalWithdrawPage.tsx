"use client";

import { ChevronRight, X } from "lucide-react";
import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PlayerCardGrid from "@/components/ui/PlayerCardGrid";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function SheriffFinalWithdrawPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number } = state;

  // Fallback: show all alive players (candidates not explicitly in GameState)
  const alivePlayers = getAlivePlayers(state.players);

  const cards = alivePlayers.map((p) => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
  }));

  // Treat current player as potential candidate if they're alive
  const myPlayer = state.players.find((p) => p.id === myPlayerId);
  const iAmCandidate = myPlayer?.alive === true;

  const handleWithdraw = () => {
    onAction("sheriff_action", { action: "withdraw" });
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
        title={`第 ${day_number} 天 · 最後退水`}
        variant="werewolf"
      />

      <NotificationBanner
        message="候選人最後決定是否退出競選"
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
          最後退水：候選人可選擇退出競選
        </div>

        {iAmCandidate && (
          <button
            type="button"
            onClick={handleWithdraw}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white"
            style={{ background: "var(--action-danger, #E53E3E)" }}
          >
            <X size={16} />
            退出競選
          </button>
        )}

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
