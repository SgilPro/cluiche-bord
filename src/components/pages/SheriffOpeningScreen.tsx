"use client";

interface SheriffOpeningScreenProps {
  dayNumber: number;
}

export default function SheriffOpeningScreen({ dayNumber }: SheriffOpeningScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#C17A30]">
      <div className="mx-auto flex max-w-[430px] flex-col items-center gap-6 px-6 text-center">
        {/* Sheriff icon placeholder */}
        <div className="text-6xl">⭐</div>
        <h1 className="text-3xl font-bold text-white">
          Day {dayNumber}
        </h1>
        <p className="text-lg text-white/80">Police Phase</p>
        <div className="mt-4 rounded-xl bg-black/20 px-6 py-3">
          <p className="text-base font-medium text-white">
            請所有玩家睜開雙眼
          </p>
        </div>
      </div>
    </div>
  );
}
