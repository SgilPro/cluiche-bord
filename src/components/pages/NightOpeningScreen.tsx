"use client";

import PhaseTimer from "@/components/ui/PhaseTimer";

interface NightOpeningScreenProps {
  dayNumber: number;
  timerEndsAt?: number;
  isHost?: boolean;
  onAdvance?: () => void;
}

export default function NightOpeningScreen({
  dayNumber,
  timerEndsAt,
  isHost,
  onAdvance,
}: NightOpeningScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background-primary)]">
      <div className="mx-auto flex max-w-[430px] flex-col items-center gap-6 px-6 text-center">
        {/* Moon icon placeholder */}
        <div className="text-6xl">🌙</div>
        <h1 className="text-3xl font-bold text-[var(--text-on-dark)]">
          Day {dayNumber}
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">Night Phase</p>
        <div className="mt-4 rounded-xl bg-white/10 px-6 py-3">
          <p className="text-base font-medium text-[var(--text-on-dark)]">
            請所有玩家閉上雙眼
          </p>
        </div>

        <PhaseTimer timerEndsAt={timerEndsAt} className="text-3xl" />

        {isHost && onAdvance && (
          <button
            type="button"
            onClick={onAdvance}
            className="mt-2 rounded-xl bg-white/20 px-8 py-3 text-sm font-medium text-[var(--text-on-dark)] hover:bg-white/30 active:bg-white/10"
          >
            推進
          </button>
        )}
      </div>
    </div>
  );
}
