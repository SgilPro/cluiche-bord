"use client";

import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import type { PhasePageProps } from "./phase-types";

export default function NightWolvesPage({ state, roomId }: PhasePageProps) {
  const { day_number, players, sub_phase } = state;
  const alive = players.filter((p) => p.alive);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 夜 · 狼人階段`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            狼人請選擇落刀對象（或空刀）
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            sub_phase: {sub_phase}
          </p>
          <ul className="mt-3 space-y-2">
            {alive.map((p) => (
              <li
                key={p.id}
                className="rounded-lg bg-[var(--background-muted)] px-3 py-2 text-[var(--text-on-dark)]"
              >
                座位 {p.seat_index + 1}
              </li>
            ))}
          </ul>
        </Card>
        <p className="text-xs text-[var(--text-secondary)]">
          房間 {roomId} · 此階段由 Channel 提供完整互動
        </p>
      </main>
    </div>
  );
}
