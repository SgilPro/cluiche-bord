"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function DayVotePage({ state, roomId }: PhasePageProps) {
  const { day_number } = state;
  const alive = getAlivePlayers(state.players);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 放逐投票`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            請投票選擇要放逐的玩家
          </p>
          <ul className="mt-3 space-y-2">
            {alive.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="rounded-lg bg-[var(--background-muted)] px-3 py-2 text-[var(--text-on-dark)] flex-1">
                  座位 {p.seat_index + 1}
                </span>
                <Button variant="secondary" className="shrink-0">
                  投票
                </Button>
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
