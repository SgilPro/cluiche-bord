"use client";

import { Shield } from "lucide-react";
import {
  ActionFooter,
  Header,
  NotificationBanner,
} from "@/components/ui";
import type { PhasePageProps } from "./phase-types";

export default function NightHunterCheckPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, players } = state;

  const me = players.find((p) => p.id === myPlayerId);
  const myRole = me?.role ?? null;
  const isHunter = myRole === "hunter";

  if (!isHunter) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background-primary)]">
        <Header title={`第 ${day_number} 夜 · 獵人確認`} variant="werewolf" />
        <NotificationBanner message="夜晚階段｜獵人正在確認身份..." />
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-center text-lg font-bold text-[var(--text-on-dark)]">
            Day {day_number}｜Hunter Check
          </p>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    onAction("night_action", { action: "hunter_confirm" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)] pb-24">
      <Header title={`第 ${day_number} 夜 · 獵人確認`} variant="werewolf" />

      <main className="mx-auto flex w-full max-w-[430px] flex-1 flex-col items-center justify-center gap-6 px-4 py-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield size={48} className="text-[var(--accent-secondary)]" />
          <p className="text-lg font-bold text-[var(--text-on-dark)]">
            你是獵人
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            已知曉身份，請確認準備天亮
          </p>
        </div>
      </main>

      <ActionFooter
        variant="dark"
        right={{
          label: "確認",
          icon: <Shield size={16} />,
          onClick: handleConfirm,
        }}
      />
    </div>
  );
}
