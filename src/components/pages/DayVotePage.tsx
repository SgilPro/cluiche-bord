"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PhaseTimer from "@/components/ui/PhaseTimer";
import PlayerCardGrid from "@/components/ui/PlayerCardGrid";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function DayVotePage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, sheriff_id, timer_ends_at } = state;
  const alive = getAlivePlayers(state.players);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isHost = state.players[0]?.id === myPlayerId;

  const cards = alive.map((p) => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
    isSelected: p.id === selectedId,
    badge:
      p.id === sheriff_id ? (
        <Crown size={14} className="text-[var(--accent-primary)]" />
      ) : undefined,
  }));

  const handleSelect = (playerId: string) => {
    setSelectedId((prev) => (prev === playerId ? null : playerId));
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onAction("day_vote", { target_id: selectedId });
  };

  const handleCancel = () => {
    setSelectedId(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 放逐投票`}
        variant="werewolf"
      />

      <NotificationBanner message="請點選你認為是狼人的玩家進行放逐投票" />

      {timer_ends_at !== undefined && (
        <div className="mx-auto flex w-full max-w-[430px] items-center justify-center px-4 py-2">
          <PhaseTimer timerEndsAt={timer_ends_at} className="text-2xl" />
        </div>
      )}

      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        <PlayerCardGrid cards={cards} onSelect={handleSelect} />
      </main>

      <ActionFooter
        variant="light"
        left={
          isHost
            ? {
                label: "強制推進",
                onClick: () => onAction("advance", {}),
              }
            : undefined
        }
        center={{
          label: "取消選擇",
          onClick: handleCancel,
          disabled: selectedId === null,
        }}
        right={{
          label: "確認放逐",
          onClick: handleConfirm,
          disabled: selectedId === null,
        }}
      />
    </div>
  );
}
