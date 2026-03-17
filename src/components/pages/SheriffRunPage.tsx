"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";

export default function SheriffRunPage({ state, roomId }: PhasePageProps) {
  const { day_number } = state;
  const alive = getAlivePlayers(state.players);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 警長競選`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            請選擇是否競選警長
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="primary" fullWidth>
              競選警長
            </Button>
            <Button variant="secondary" fullWidth>
              不競選
            </Button>
          </div>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            競選玩家：{alive.length} 人
          </p>
        </Card>
        <p className="text-xs text-[var(--text-secondary)]">
          房間 {roomId} · 此階段由 Channel 提供完整互動
        </p>
      </main>
    </div>
  );
}
