"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function GameRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">房間 {roomId}</h1>
      <p className="text-gray-600 mb-4">
        遊戲畫面將由 Phoenix Channel 與 Elixir 後端提供（見 tasks/ticket-04b-channel-client.md、ticket-04d-screens.md）。
      </p>
      <Link href="/" className="text-blue-600 hover:underline">
        ← 返回首頁
      </Link>
    </main>
  );
}
