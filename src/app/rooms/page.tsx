import Link from "next/link";

export default function RoomsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background-primary)] px-6">
      <div className="text-center">
        <h1 className="mb-4 text-xl font-bold text-[var(--text-on-dark)]">
          即將開放
        </h1>
        <p className="mb-6 text-[var(--text-secondary)]">
          房間列表與加入功能即將推出，敬請期待。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-secondary)] px-4 py-2.5 text-base font-medium text-[var(--text-on-dark)] transition-opacity hover:opacity-90"
        >
          返回首頁
        </Link>
      </div>
    </main>
  );
}
