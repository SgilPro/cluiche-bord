"use client";

export interface PlayerListItemProps {
  seatNumber: number;
  name: string | null;
  isHost?: boolean;
  isEmpty?: boolean;
}

export default function PlayerListItem({
  seatNumber,
  name,
  isHost = false,
  isEmpty = false,
}: PlayerListItemProps) {
  const bg = isHost ? "bg-[var(--accent-green)]" : "bg-[var(--background-surface)]";
  const numberColor = isEmpty ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]";
  const nameColor = isEmpty ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]";
  const displayName = isEmpty ? "等待玩家加入..." : (name ?? "");

  return (
    <div
      className={`flex h-[70px] items-center gap-3 px-4 ${bg}`}
      data-seat={seatNumber}
      data-empty={isEmpty}
      data-host={isHost}
    >
      <span className={`w-8 shrink-0 text-sm font-medium ${numberColor}`}>
        {String(seatNumber).padStart(2, "0")}
      </span>
      <div className="flex min-w-0 flex-1 items-center">
        <span className={`truncate text-[16px] font-bold ${nameColor}`}>{displayName}</span>
      </div>
      {isHost && (
        <span className="shrink-0 text-[var(--accent-primary)]" aria-hidden>
          👑
        </span>
      )}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--placeholder-avatar)]">
        <span className="sr-only">頭像</span>
      </div>
    </div>
  );
}
