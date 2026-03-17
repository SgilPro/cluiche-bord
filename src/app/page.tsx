import { Plus, SquareArrowRightEnter } from "lucide-react";
import Link from "next/link";

const buttonBase =
  "inline-flex w-full max-w-[280px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-bold transition-opacity";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col px-6 pt-8">
      <div className="border-b border-dotted border-[#323949] pb-4">
        <h1 className="text-2xl font-bold text-[var(--accent-primary)]">
          Cluiche bord
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <Link
          href="/create-room"
          className={`${buttonBase} bg-[var(--accent-primary)] text-white hover:opacity-90`}
        >
          <Plus aria-hidden className="h-4 w-4" />
          建立房間
        </Link>
        <Link
          href="/rooms"
          className={`${buttonBase} bg-[var(--accent-secondary)] text-[var(--text-on-dark)] hover:opacity-90`}
        >
          <SquareArrowRightEnter aria-hidden className="h-4 w-4" />
          進入房間
        </Link>
      </div>
    </main>
  );
}
