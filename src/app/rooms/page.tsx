"use client";

import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Room {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
  players: string[];
}

export default function RoomsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    fetchRooms();

    const socket = getSocket();

    socket.on("user-joined", (roomId: string) => {
      console.log("User joined room:", roomId);
      fetchRooms();
    });

    socket.on("user-left", (roomId: string) => {
      console.log("User left room:", roomId);
      fetchRooms();
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      const data = await response.json();
      console.log("Fetched rooms:", data);
      setRooms(data.rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          maxPlayers,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setRoomName("");
        router.push(`/game/${data.room.id}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (roomCode.trim()) {
      router.push(`/game/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">遊戲房間</h1>
        <div className="space-x-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            創建房間
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            加入房間
          </button>
        </div>
      </div>

      {/* 創建房間的 Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">創建房間</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  房間名稱
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  最大玩家數
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {[2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} 人
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  創建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 加入房間的 Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">加入房間</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  房間代碼
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="輸入 6 位數房間代碼"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  onClick={() => handleJoinRoom(roomCode)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  加入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 房間列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
            <div className="text-gray-600 mb-4">
              <p>房間代碼：{room.id}</p>
              <p>
                玩家數：{room.players.length}/{room.maxPlayers}
              </p>
              <p>建立時間：{new Date(room.createdAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => handleJoinRoom(room.id)}
              disabled={room.players.length >= room.maxPlayers}
              className={`w-full py-2 px-4 rounded-md ${
                room.players.length >= room.maxPlayers
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {room.players.length >= room.maxPlayers ? "房間已滿" : "加入房間"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
