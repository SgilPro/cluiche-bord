"use client";

import { X } from "lucide-react";
import type { PublicLogEntry } from "@/lib/games/werewolf/types";

export interface GameLogPanelProps {
  entries: PublicLogEntry[];
  onClose: () => void;
}

export default function GameLogPanel({ entries, onClose }: GameLogPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-base font-semibold text-white">遊戲記錄</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 hover:text-white"
          aria-label="關閉"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-white/40 text-center py-8">尚無記錄</p>
        )}
        {[...entries].reverse().map((entry) => (
          <div key={entry.seq} className="rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/30">#{entry.seq}</span>
              <span className="text-[10px] text-white/40">
                第 {entry.day} {entry.phase === "night" ? "夜" : "天"} · {entry.type}
              </span>
            </div>
            {entry.narration && (
              <p className="text-sm text-white/80">{entry.narration}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
