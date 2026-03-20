"use client";

import { useState } from "react";
import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PlayerCardGrid from "@/components/ui/PlayerCardGrid";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function SheriffHandoverPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, sheriff_id, players } = state;
  const alive = getAlivePlayers(players);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isSheriff = myPlayerId === sheriff_id;

  // Alive players excluding the sheriff themselves
  const targets = alive.filter((p) => p.id !== myPlayerId);

  const cards = targets.map((p) => ({
    player: p,
    seatLabel: String(p.seat_index + 1).padStart(2, "0"),
    isSelected: p.id === selectedId,
  }));

  const handleSelect = (playerId: string) => {
    setSelectedId((prev) => (prev === playerId ? null : playerId));
  };

  const handleHandover = () => {
    if (!selectedId) return;
    onAction("sheriff_action", { action: "handover", target_id: selectedId });
  };

  const handleDiscard = () => {
    onAction("sheriff_action", { action: "discard" });
  };

  if (!isSheriff) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background-surface)]">
        <Header
          title={`第 ${day_number} 天 · 警徽交接`}
          variant="werewolf"
        />
        <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col items-center justify-center gap-3 px-4">
          <p className="text-lg font-medium text-[var(--text-secondary)]">
            警長正在交接警徽...
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 警徽交接`}
        variant="werewolf"
      />

      <NotificationBanner message="你是警長，請選擇交接警徽給誰，或丟入水中" />

      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        <PlayerCardGrid cards={cards} onSelect={handleSelect} />
      </main>

      <ActionFooter
        variant="light"
        left={{
          label: "警徽入水",
          onClick: handleDiscard,
        }}
        right={{
          label: "交接警徽",
          onClick: handleHandover,
          disabled: selectedId === null,
        }}
      />
    </div>
  );
}
