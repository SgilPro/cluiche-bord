"use client";

import { useEffect, useState } from "react";

export interface PhaseTimerProps {
  /** Unix timestamp in seconds */
  timerEndsAt?: number;
  className?: string;
}

export default function PhaseTimer({ timerEndsAt, className }: PhaseTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (timerEndsAt === undefined) {
      setSecondsLeft(null);
      return;
    }

    const calc = () => {
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, timerEndsAt - now);
    };

    setSecondsLeft(calc());

    const id = setInterval(() => {
      const remaining = calc();
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [timerEndsAt]);

  if (secondsLeft === null) return null;

  return (
    <span
      className={[
        "tabular-nums font-bold text-[var(--text-on-dark)]",
        className ?? "",
      ].join(" ")}
    >
      {secondsLeft}
    </span>
  );
}
