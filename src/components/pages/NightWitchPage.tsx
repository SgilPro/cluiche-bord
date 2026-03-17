"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import type { PhasePageProps } from "./phase-types";

export default function NightWitchPage({ state, roomId }: PhasePageProps) {
  const { day_number } = state;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header
        title={`第 ${day_number} 夜 · 女巫階段`}
        variant="werewolf"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">
        <Card>
          <p className="text-[var(--text-secondary)]">
            女巫請選擇：解藥 / 毒藥 / 不使用
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="success" fullWidth>
              使用解藥
            </Button>
            <Button variant="danger" fullWidth>
              使用毒藥
            </Button>
            <Button variant="secondary" fullWidth>
              不使用
            </Button>
          </div>
        </Card>
        <p className="text-xs text-[var(--text-secondary)]">
          房間 {roomId} · 此階段由 Channel 提供完整互動
        </p>
      </main>
    </div>
  );
}
