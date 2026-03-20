"use client";

import { useRouter } from "next/navigation";
import type { Player, VictoryFaction } from "@/lib/games/werewolf/types";

const ROLE_LABELS: Record<string, string> = {
  wolf: "狼人",
  seer: "預言家",
  witch: "女巫",
  hunter: "獵人",
  villager: "村民",
};

interface VictoryPageProps {
  faction: VictoryFaction;
  players: Player[];
  onReturn?: () => void;
}

export default function VictoryPage({ faction, players, onReturn }: VictoryPageProps) {
  const router = useRouter();

  const isVillagerWin = faction === "villagers";
  const bgClass = isVillagerWin ? "bg-[#E8EEF4]" : "bg-[var(--background-primary)]";
  const titleTextClass = isVillagerWin ? "text-[var(--text-primary)]" : "text-[var(--text-on-dark)]";
  const subtextClass = isVillagerWin ? "text-[var(--text-secondary)]" : "text-[var(--text-secondary)]";

  const handleReturn = () => {
    if (onReturn) {
      onReturn();
    } else {
      router.push("/");
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${bgClass}`}>
      {/* Header */}
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="text-5xl">{isVillagerWin ? "🎉" : "🐺"}</span>
        <h1 className={`mt-4 text-3xl font-bold ${titleTextClass}`}>
          {isVillagerWin ? "好人陣營勝利" : "狼人陣營勝利"}
        </h1>
      </div>

      {/* Player role list */}
      <div className="mx-auto w-full max-w-[430px] flex-1 px-4">
        <p className={`mb-3 text-sm font-medium ${subtextClass}`}>所有玩家角色</p>
        <ul className="space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
            >
              <span className={`text-sm ${titleTextClass}`}>
                座位 {p.seat_index + 1}
                {(p as Player & { nickname?: string }).nickname
                  ? ` · ${(p as Player & { nickname?: string }).nickname}`
                  : ""}
              </span>
              <span className={`text-sm font-bold ${p.role === "wolf" ? "text-red-400" : titleTextClass}`}>
                {p.role ? (ROLE_LABELS[p.role] ?? p.role) : "未知"}
                {!p.alive && " ☠"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Return button */}
      <div className="mx-auto w-full max-w-[430px] px-4 pb-10 pt-6">
        <button
          type="button"
          onClick={handleReturn}
          className="w-full rounded-xl bg-[var(--accent-primary)] py-4 text-base font-bold text-white hover:opacity-90 active:opacity-70"
        >
          返回大廳
        </button>
      </div>
    </div>
  );
}
