"use client";

interface NightOpeningScreenProps {
  dayNumber: number;
}

export default function NightOpeningScreen({ dayNumber }: NightOpeningScreenProps) {
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
      </div>
    </div>
  );
}
