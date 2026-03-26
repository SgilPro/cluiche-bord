"use client";

import { BookOpen } from "lucide-react";

export interface NarrationBarProps {
  narration: string | null;
  onOpenLog: () => void;
}

export default function NarrationBar({ narration, onOpenLog }: NarrationBarProps) {
  if (!narration) return null;
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40">
      <div className="flex items-center gap-2 bg-black/80 px-4 py-2">
        <p className="flex-1 text-sm text-white/90 line-clamp-2">{narration}</p>
        <button
          type="button"
          onClick={onOpenLog}
          className="shrink-0 rounded-lg p-1.5 text-white/60 hover:text-white"
          aria-label="查看遊戲記錄"
        >
          <BookOpen size={18} />
        </button>
      </div>
    </div>
  );
}
