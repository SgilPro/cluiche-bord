"use client";

import { User } from "lucide-react";
import type { Player } from "@/lib/games/werewolf/types";

export interface PlayerCard {
  player: Player;
  /** Seat label displayed in the card, e.g. "01" */
  seatLabel: string;
  isSelected?: boolean;
  /** Highlight with a different color (e.g. witch inspect target) */
  isCurrentTarget?: boolean;
  /** Show eliminated overlay */
  isEliminated?: boolean;
  badge?: React.ReactNode;
}

export interface PlayerCardGridProps {
  cards: PlayerCard[];
  onSelect?: (playerId: string) => void;
  disabled?: boolean;
}

export default function PlayerCardGrid({
  cards,
  onSelect,
  disabled = false,
}: PlayerCardGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(
        ({ player, seatLabel, isSelected, isCurrentTarget, isEliminated, badge }) => {
          const handleClick = () => {
            if (!disabled && !isEliminated && onSelect) {
              onSelect(player.id);
            }
          };

          return (
            <button
              key={player.id}
              type="button"
              onClick={handleClick}
              disabled={disabled || isEliminated}
              className={[
                "relative flex flex-col items-center gap-1 rounded-xl px-2 py-3",
                "bg-[var(--background-surface)] transition-all",
                "border-2",
                isSelected
                  ? "border-[var(--action-danger)]"
                  : isCurrentTarget
                    ? "border-[var(--accent-secondary)]"
                    : "border-transparent",
                isEliminated ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                !isEliminated && !disabled ? "hover:opacity-80 active:scale-95" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Seat label */}
              <span className="absolute top-1 left-2 text-[10px] font-bold text-[var(--text-secondary)]">
                {seatLabel}
              </span>

              {/* Badge (e.g. sheriff crown) */}
              {badge && (
                <span className="absolute top-1 right-1">{badge}</span>
              )}

              {/* Avatar placeholder */}
              <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background-muted)]">
                <User size={20} className="text-[var(--text-secondary)]" />
              </div>

              {/* Nickname or id */}
              <span className="w-full truncate text-center text-xs text-[var(--text-on-dark)]">
                {(player as Player & { nickname?: string }).nickname ??
                  `P${player.seat_index + 1}`}
              </span>
            </button>
          );
        },
      )}
    </div>
  );
}
