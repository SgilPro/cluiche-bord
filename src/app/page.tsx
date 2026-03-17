import Link from "next/link";

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10 4v12M4 10h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 4l4 4-4 4M18 8H6M4 4v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium transition-opacity w-full";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background-primary)]">
      <div className="flex min-h-screen flex-col px-6 pt-8">
        <h1 className="text-2xl font-bold text-[var(--accent-primary)]">
          Cluiche bord
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Link
            href="/create-room"
            className={`${buttonBase} bg-[var(--accent-primary)] text-white hover:opacity-90`}
          >
            <PlusIcon />
            建立房間
          </Link>
          <Link
            href="/rooms"
            className={`${buttonBase} bg-[var(--accent-secondary)] text-[var(--text-on-dark)] hover:opacity-90`}
          >
            <EnterIcon />
            進入房間
          </Link>
        </div>
      </div>
    </main>
  );
}
