"use client";

import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function DaySpeechPage({ state, roomId }: PhasePageProps) {
  const { day_number } = state;
  const alive = getAlivePlayers(state.players);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 發言階段`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            請依照發言順序進行討論
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
