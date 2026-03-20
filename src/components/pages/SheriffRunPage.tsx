"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PlayerCardGrid from "@/components/ui/PlayerCardGrid";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function SheriffRunPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number } = state;
  const alive = getAlivePlayers(state.players);

  // Local state: whether I've raised my hand to run
  const [hasRaisedHand, setHasRaisedHand] = useState(false);

  const cards = alive.map((p) => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
    isSelected: p.id === myPlayerId && hasRaisedHand,
  }));

  const handleSelectCard = (playerId: string) => {
    // Only allow toggling yourself
    if (playerId === myPlayerId) {
      setHasRaisedHand((prev) => !prev);
    }
  };

  const handleWithdraw = () => {
    setHasRaisedHand(false);
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
        title={`第 ${day_number} 天 · 上警競選`}
        variant="werewolf"
      />

      <NotificationBanner
        message="請有意願競選警長的玩家舉手（點選自己的卡片），房主可強制推進"
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
          上警階段：點選自己的名牌舉手競選
        </div>

        <PlayerCardGrid
          cards={cards}
          onSelect={handleSelectCard}
        />
      </main>

      <ActionFooter
        variant="light"
        left={
          hasRaisedHand
            ? {
                label: "退出競選",
                icon: <X size={16} />,
                onClick: handleWithdraw,
              }
            : undefined
        }
        right={{
          label: "強制推進",
          icon: <ChevronRight size={16} />,
          onClick: handleAdvance,
        }}
      />
    </div>
  );
}
