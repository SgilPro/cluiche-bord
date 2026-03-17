"use client";

import Link from "next/link";

export default function RoomsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">遊戲房間</h1>
      <p className="text-gray-600 mb-4">
        房間列表與建立/加入將由 Elixir 後端 API 提供（見 tasks/ticket-04a-auth-rest-client.md）。
      </p>
      <Link href="/" className="text-blue-600 hover:underline">
        ← 返回首頁
      </Link>
    </main>
  );
}
