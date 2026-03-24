"use client";

import Header from "@/components/ui/Header";
import ActionFooter from "@/components/ui/ActionFooter";
import type { PhasePageProps } from "./phase-types";
import type { Player } from "@/lib/games/werewolf/types";

function getDisplayName(player: Player): string {
  return player.nickname ?? `座位 ${player.seat_index + 1}`;
}

export default function LastWordPage({
  state,
  myPlayerId,
  onAction,
}: PhasePageProps) {
  const {
    day_number,
    players,
    last_word_ids,
    last_word_index,
    last_word_current_id,
  } = state;

  const isHost = players[0]?.id === myPlayerId;

  const total = last_word_ids?.length ?? 0;
  const currentIndex = last_word_index ?? 0;

  const currentSpeaker = last_word_current_id
    ? players.find((p) => p.id === last_word_current_id) ?? null
    : null;

  const speakerName = currentSpeaker ? getDisplayName(currentSpeaker) : "（等待中）";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)] pb-24">
      <Header
        title={`第 ${day_number} 天 · 遺言`}
        variant="werewolf"
      />

      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-6">
        {/* Current speaker info */}
        <div className="mb-6 flex flex-col items-center gap-2 rounded-xl bg-[var(--background-surface)] px-4 py-5 shadow-sm border border-black/5">
          <p className="text-xs text-[var(--text-secondary)]">
            遺言 {currentIndex + 1} / {total}
          </p>
          <p className="text-xl font-bold text-[var(--text-primary)]">
            {speakerName} 正在說遺言...
          </p>
        </div>

        {/* Player list highlighting current speaker */}
        <ul className="space-y-2">
          {(last_word_ids ?? []).map((id) => {
            const p = players.find((pl) => pl.id === id);
            if (!p) return null;
            const isCurrent = id === last_word_current_id;
            return (
              <li
                key={id}
                className={[
                  "flex items-center gap-3 rounded-xl px-4 py-3",
                  isCurrent
                    ? "bg-[var(--action-danger)]/10 border border-[var(--action-danger)]/30"
                    : "bg-[var(--background-surface)] border border-black/5",
                ].join(" ")}
              >
                <span className="w-8 shrink-0 text-sm font-bold text-[var(--text-secondary)]">
                  {String(p.seat_index + 1).padStart(2, "0")}
                </span>
                <span
                  className={[
                    "flex-1 font-medium",
                    isCurrent ? "text-[var(--action-danger)]" : "text-[var(--text-primary)]",
                  ].join(" ")}
                >
                  {getDisplayName(p)}
                </span>
                {isCurrent && (
                  <span className="text-xs text-[var(--action-danger)]">發言中</span>
                )}
              </li>
            );
          })}
        </ul>
      </main>

      {isHost && (
        <ActionFooter
          variant="light"
          right={{
            label: "下一位 / 結束",
            onClick: () => onAction("advance", {}),
          }}
        />
      )}
    </div>
  );
}
