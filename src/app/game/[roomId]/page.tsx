"use client";

import GameChat from "@/components/GameChat";
import { useParams } from "next/navigation";

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <div className="flex h-screen">
      {/* 遊戲主區域 */}
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">遊戲房間: {roomId}</h1>
        <div className="bg-white rounded-lg shadow-md p-4">
          {/* 這裡將來會放置遊戲內容 */}
          <p>遊戲內容將在這裡顯示</p>
        </div>
      </div>

      {/* 聊天區域 */}
      <div className="w-80 border-l border-gray-200">
        <GameChat roomId={roomId} />
      </div>
    </div>
  );
}
