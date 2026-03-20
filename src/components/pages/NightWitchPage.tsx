"use client";

import { useState } from "react";
import { Pill, Skull, X, Check } from "lucide-react";
import {
  PlayerCardGrid,
  PhaseTimer,
  ActionFooter,
  Header,
  NotificationBanner,
} from "@/components/ui";
import type { PlayerCard } from "@/components/ui";
import type { PhasePageProps } from "./phase-types";

type WitchItem = "antidote" | "poison" | "none";

export default function NightWitchPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, players, timer_ends_at, pending_death } = state;
  const [selectedItem, setSelectedItem] = useState<WitchItem | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const me = players.find((p) => p.id === myPlayerId);
  const myRole = me?.role ?? null;
  const isWitch = myRole === "witch";

  const alivePlayers = players.filter((p) => p.alive);

  if (!isWitch) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background-primary)]">
        <Header title={`第 ${day_number} 夜 · 女巫階段`} variant="werewolf" />
        <NotificationBanner message="夜晚階段｜女巫正在做決定..." />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-lg font-bold text-[var(--text-on-dark)]">
            Day {day_number}｜Witch Phase
          </p>
        </div>
      </div>
    );
  }

  const handleItemSelect = (item: WitchItem) => {
    setSelectedItem((prev) => (prev === item ? null : item));
    setTargetId(null);
  };

  const handleCardSelect = (id: string) => {
    setTargetId((prev) => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    if (selectedItem === "antidote" && pending_death) {
      onAction("night_action", { action: "witch_save", target_id: pending_death });
    } else if (selectedItem === "poison" && targetId) {
      onAction("night_action", { action: "witch_poison", target_id: targetId });
    } else if (selectedItem === "none") {
      onAction("night_action", { action: "witch_pass" });
    }
  };

  const isConfirmDisabled = (): boolean => {
    if (!selectedItem) return true;
    if (selectedItem === "antidote") return !pending_death;
    if (selectedItem === "poison") return !targetId;
    return false; // none
  };

  const cards: PlayerCard[] = alivePlayers.map((p) => {
    const isCurrentTarget =
      selectedItem === "antidote" && p.id === pending_death;
    const isSelected = selectedItem === "poison" && targetId === p.id;

    return {
      player: p,
      seatLabel: String(p.seat_index + 1).padStart(2, "0"),
      isSelected,
      isCurrentTarget,
    };
  });

  const itemButtonClass = (item: WitchItem) =>
    [
      "flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-3 text-sm font-medium transition-all border-2",
      selectedItem === item
        ? "border-[var(--accent-secondary)] bg-[var(--background-surface)] text-[var(--text-on-dark)]"
        : "border-transparent bg-[var(--background-muted)] text-[var(--text-secondary)]",
    ].join(" ");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header title={`第 ${day_number} 夜 · 女巫階段`} variant="werewolf" />

      <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <PhaseTimer timerEndsAt={timer_ends_at} />
          <p className="text-xs text-[var(--text-secondary)]">
            請先選擇欲使用道具再點擊角色卡片選擇欲殺害／治癒對象
          </p>
        </div>

        {/* Item selection */}
        <div className="flex gap-3">
          <button
            type="button"
            className={itemButtonClass("antidote")}
            onClick={() => handleItemSelect("antidote")}
          >
            <Pill size={20} />
            <span>解藥</span>
          </button>
          <button
            type="button"
            className={itemButtonClass("poison")}
            onClick={() => handleItemSelect("poison")}
          >
            <Skull size={20} />
            <span>毒藥</span>
          </button>
          <button
            type="button"
            className={itemButtonClass("none")}
            onClick={() => handleItemSelect("none")}
          >
            <X size={20} />
            <span>不使用</span>
          </button>
        </div>

        {/* Player grid - only shown when antidote or poison is selected */}
        {(selectedItem === "antidote" || selectedItem === "poison") && (
          <PlayerCardGrid
            cards={cards}
            onSelect={selectedItem === "poison" ? handleCardSelect : undefined}
            disabled={selectedItem === "antidote"}
          />
        )}
      </main>

      <ActionFooter
        variant="dark"
        right={{
          label: "確認",
          icon: <Check size={16} />,
          onClick: handleConfirm,
          disabled: isConfirmDisabled(),
        }}
      />
    </div>
  );
}
