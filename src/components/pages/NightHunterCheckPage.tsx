"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import type { PhasePageProps } from "./phase-types";

export default function NightHunterCheckPage({ state, roomId }: PhasePageProps) {
  const { day_number } = state;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 夜 · 獵人確認`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            獵人請確認身份，準備天亮
          </p>
          <Button variant="primary" fullWidth className="mt-4">
            確認
          </Button>
        </Card>
        <p className="text-xs text-[var(--text-secondary)]">
          房間 {roomId} · 此階段由 Channel 提供完整互動
        </p>
      </main>
    </div>
  );
}
