"use client";

import { Skull } from "lucide-react";
import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import ActionFooter from "@/components/ui/ActionFooter";
import type { PhasePageProps } from "./phase-types";

export default function DayAnnounceDeathsPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, pending_death, players } = state;

  const deathPlayer = pending_death
    ? players.find((p) => p.id === pending_death) ?? null
    : null;

  const isHost = players[0]?.id === myPlayerId;

  const displayName = (id: string) => {
    const p = players.find((pl) => pl.id === id);
    if (!p) return id;
    return (p as typeof p & { nickname?: string }).nickname ?? `座位 ${p.seat_index + 1}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header
        title={`第 ${day_number} 天早晨 · 昨夜公報`}
        variant="werewolf"
      />

      {deathPlayer === null ? (
        <NotificationBanner message="昨夜平安，無人死亡" />
      ) : (
        <NotificationBanner message="昨夜有玩家死亡" />
      )}

      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        {deathPlayer === null ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-[var(--text-secondary)]">
            <p className="text-lg font-medium">昨夜平安，無人死亡</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              昨夜死亡的玩家：
            </p>
            <div className="flex items-center gap-3 rounded-xl bg-[var(--action-danger)]/10 px-4 py-3 border border-[var(--action-danger)]/30">
              <Skull size={20} className="shrink-0 text-[var(--action-danger)]" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">
                  {displayName(deathPlayer.id)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  座位 {deathPlayer.seat_index + 1}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {isHost && (
        <ActionFooter
          variant="light"
          right={{
            label: "繼續",
            onClick: () => onAction("advance", {}),
          }}
        />
      )}
    </div>
  );
}
