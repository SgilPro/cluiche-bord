"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import type { PhasePageProps } from "./phase-types";

export default function SheriffFinalWithdrawPage({
  state,
  roomId,
}: PhasePageProps) {
  const { day_number } = state;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 警長退水`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            競選玩家可選擇退水，不繼續競選
          </p>
          <Button variant="secondary" fullWidth className="mt-4">
            退水
          </Button>
        </Card>
        <p className="text-xs text-[var(--text-secondary)]">房間 {roomId}</p>
      </main>
    </div>
  );
}
