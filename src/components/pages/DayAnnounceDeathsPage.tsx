"use client";

import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import type { PhasePageProps } from "./phase-types";

export default function DayAnnounceDeathsPage({
  state,
  roomId,
}: PhasePageProps) {
  const { day_number, pending_death, players } = state;
  const deaths = pending_death
    ? players.filter((p) => p.id === pending_death)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 公布死亡`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            {deaths.length > 0
              ? "昨夜死亡的玩家："
              : "昨夜是平安夜，無人死亡"}
          </p>
          {deaths.length > 0 && (
            <ul className="mt-3 space-y-2">
              {deaths.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg bg-[var(--action-danger)]/20 px-3 py-2 text-[var(--text-primary)]"
                >
                  座位 {p.seat_index + 1}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <p className="text-xs text-[var(--text-secondary)]">
          房間 {roomId} · 此階段由 Channel 提供完整互動
        </p>
      </main>
    </div>
  );
}
