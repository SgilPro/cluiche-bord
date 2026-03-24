"use client";

import Header from "@/components/ui/Header";
import NotificationBanner from "@/components/ui/NotificationBanner";
import PhaseTimer from "@/components/ui/PhaseTimer";
import ActionFooter from "@/components/ui/ActionFooter";
import { getAlivePlayers } from "./phase-types";
import type { PhasePageProps } from "./phase-types";
import type { Player } from "@/lib/games/werewolf/types";

function getDisplayName(player: Player): string {
  return player.nickname ?? `座位 ${player.seat_index + 1}`;
}

export default function DaySpeechPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const { day_number, sheriff_id, timer_ends_at } = state;
  const alive = getAlivePlayers(state.players);

  const isHost = state.players[0]?.id === myPlayerId;

  const speechRule = sheriff_id
    ? "由警長決定發言起始方向（死左或死右）"
    : "隨機決定起始玩家，順時針依序發言";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 發言階段`}
        variant="werewolf"
      />

      <NotificationBanner message={speechRule} />

      {timer_ends_at !== undefined && (
        <div className="mx-auto flex w-full max-w-[430px] items-center justify-center px-4 py-2">
          <PhaseTimer timerEndsAt={timer_ends_at} className="text-2xl" />
        </div>
      )}

      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        <ul className="space-y-2">
          {alive.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--background-surface)] px-4 py-3 shadow-sm border border-black/5"
            >
              <span className="w-8 shrink-0 text-sm font-bold text-[var(--text-secondary)]">
                {String(p.seat_index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-medium text-[var(--text-primary)]">
                {getDisplayName(p)}
              </span>
            </li>
          ))}
        </ul>
      </main>

      {isHost && (
        <ActionFooter
          variant="light"
          right={{
            label: "推進",
            onClick: () => onAction("advance", {}),
          }}
        />
      )}
    </div>
  );
}
