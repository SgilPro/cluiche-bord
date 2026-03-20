"use client";

import { useState } from "react";
import { Swords, RotateCcw, Check } from "lucide-react";
import {
  PlayerCardGrid,
  PhaseTimer,
  ActionFooter,
  Header,
  NotificationBanner,
} from "@/components/ui";
import type { PlayerCard } from "@/components/ui";
import type { PhasePageProps } from "./phase-types";

export default function NightWolvesPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, players, timer_ends_at, wolf_votes, wolf_locks } = state;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const me = players.find((p) => p.id === myPlayerId);
  const myRole = me?.role ?? null;
  const isWolf = myRole === "wolf";

  const alivePlayers = players.filter((p) => p.alive);

  if (!isWolf) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background-primary)]">
        <Header title={`第 ${day_number} 夜 · 狼人階段`} variant="werewolf" />
        <NotificationBanner message="夜晚階段｜狼人們開始選擇殺害對象..." />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-lg font-bold text-[var(--text-on-dark)]">
            Day {day_number}｜Wolf Phase
          </p>
        </div>
      </div>
    );
  }

  // Active wolf UI
  const cards: PlayerCard[] = alivePlayers
    .filter((p) => p.id !== myPlayerId)
    .map((p) => {
      const isSelected =
        selectedId === p.id ||
        wolf_votes?.[myPlayerId] === p.id;
      const isLocked = wolf_locks?.includes(p.id) ?? false;

      return {
        player: p,
        seatLabel: String(p.seat_index + 1).padStart(2, "0"),
        isSelected,
        badge: isLocked && !isSelected ? (
          <span className="text-[10px] text-[var(--action-danger)]">🔒</span>
        ) : undefined,
      };
    });

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onAction("night_action", { action: "wolf_lock", target_id: selectedId });
  };

  const handleCancelSelect = () => {
    setSelectedId(null);
  };

  const handleEndTurn = () => {
    onAction("advance", {});
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header title={`第 ${day_number} 夜 · 狼人階段`} variant="werewolf" />

      <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <PhaseTimer timerEndsAt={timer_ends_at} />
          <p className="text-sm text-[var(--text-secondary)]">請選擇落刀對象</p>
        </div>

        <PlayerCardGrid
          cards={cards}
          onSelect={handleSelect}
        />
      </main>

      <ActionFooter
        variant="dark"
        left={{
          label: "結束回合",
          icon: <Check size={16} />,
          onClick: handleEndTurn,
        }}
        center={{
          label: "取消選擇",
          icon: <RotateCcw size={16} />,
          onClick: handleCancelSelect,
          disabled: !selectedId,
        }}
        right={{
          label: "確認殺害",
          icon: <Swords size={16} />,
          onClick: handleConfirm,
          disabled: !selectedId,
        }}
      />
    </div>
  );
}
