"use client";

interface DayOpeningScreenProps {
  dayNumber: number;
}

export default function DayOpeningScreen({ dayNumber }: DayOpeningScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#E8EEF4]">
      <div className="mx-auto flex max-w-[430px] flex-col items-center gap-6 px-6 text-center">
        {/* Sun icon placeholder */}
        <div className="text-6xl">☀️</div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Day {dayNumber}
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">Morning Phase</p>
        <div className="mt-4 rounded-xl bg-black/10 px-6 py-3">
          <p className="text-base font-medium text-[var(--text-primary)]">
            請所有玩家睜開雙眼
          </p>
        </div>
      </div>
    </div>
  );
}
