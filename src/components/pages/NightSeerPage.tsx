"use client";

import { useState, useEffect } from "react";
import { Eye, SkipForward } from "lucide-react";
import {
  PlayerCardGrid,
  PhaseTimer,
  ActionFooter,
  Header,
  NotificationBanner,
} from "@/components/ui";
import type { PlayerCard } from "@/components/ui";
import type { PhasePageProps } from "./phase-types";
import type { RoleActionResultKind } from "@/lib/games/werewolf/types";

interface InspectResult {
  targetId: string;
  result: RoleActionResultKind;
}

export default function NightSeerPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, players, timer_ends_at } = state;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);

  const me = players.find((p) => p.id === myPlayerId);
  const myRole = me?.role ?? null;
  const isSeer = myRole === "seer";

  const alivePlayers = players.filter((p) => p.alive);

  // Store role_action_result locally when it arrives in state
  useEffect(() => {
    const stateWithResult = state as typeof state & {
      role_action_result?: { result: RoleActionResultKind; target_id: string };
    };
    if (stateWithResult.role_action_result) {
      setInspectResult({
        targetId: stateWithResult.role_action_result.target_id,
        result: stateWithResult.role_action_result.result,
      });
    }
  }, [state]);

  if (!isSeer) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background-primary)]">
        <Header title={`第 ${day_number} 夜 · 預言家階段`} variant="werewolf" />
        <NotificationBanner message="夜晚階段｜預言家正在查驗..." />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-lg font-bold text-[var(--text-on-dark)]">
            Day {day_number}｜Seer Phase
          </p>
        </div>
      </div>
    );
  }

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    onAction("night_action", { action: "seer_inspect", target_id: selectedId });
  };

  const handleSkip = () => {
    onAction("night_action", { action: "seer_inspect", target_id: "skip" });
  };

  const getResultLabel = (result: RoleActionResultKind): string => {
    if (result === "wolf") return "狼人";
    if (result === "villager") return "好人";
    return "無";
  };

  const cards: PlayerCard[] = alivePlayers
    .filter((p) => p.id !== myPlayerId)
    .map((p) => {
      const isSelected = selectedId === p.id;
      const hasResult = inspectResult?.targetId === p.id;

      return {
        player: p,
        seatLabel: String(p.seat_index + 1).padStart(2, "0"),
        isSelected,
        badge: hasResult ? (
          <span
            className={[
              "rounded-full px-1 py-0.5 text-[9px] font-bold",
              inspectResult?.result === "wolf"
                ? "bg-[var(--action-danger)] text-white"
                : "bg-[var(--action-success)] text-white",
            ].join(" ")}
          >
            {getResultLabel(inspectResult!.result)}
          </span>
        ) : undefined,
      };
    });

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header title={`第 ${day_number} 夜 · 預言家階段`} variant="werewolf" />

      <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <PhaseTimer timerEndsAt={timer_ends_at} />
          <p className="text-sm text-[var(--text-secondary)]">請選擇一名玩家查驗身份</p>
        </div>

        {inspectResult && (
          <div className="rounded-xl bg-[var(--background-surface)] px-4 py-3 text-sm text-[var(--text-on-dark)]">
            查驗結果：
            <span
              className={
                inspectResult.result === "wolf"
                  ? "font-bold text-[var(--action-danger)]"
                  : "font-bold text-[var(--action-success)]"
              }
            >
              {getResultLabel(inspectResult.result)}
            </span>
          </div>
        )}

        <PlayerCardGrid cards={cards} onSelect={handleSelect} />
      </main>

      <ActionFooter
        variant="dark"
        left={{
          label: "跳過",
          icon: <SkipForward size={16} />,
          onClick: handleSkip,
        }}
        right={{
          label: "確認查驗",
          icon: <Eye size={16} />,
          onClick: handleConfirm,
          disabled: !selectedId,
        }}
      />
    </div>
  );
}
