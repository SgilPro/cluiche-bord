"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Room {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"games" | "rooms">("games");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "rooms") {
      setIsLoading(true);
      fetchRooms();
    }
  }, [activeTab]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setMaxPlayers(4);
        await fetchRooms();
        router.push(`/game/${data.room.id}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/game/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">歡迎來到 Cluiche Bord</h1>
        <p className="text-lg text-gray-600">
          在這裡，你可以找到各種有趣的桌遊，加入遊戲，或是創建自己的遊戲！
        </p>
      </section>

      {/* Tab 切換 */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("games")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "games"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              熱門遊戲
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "rooms"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              遊戲房間
            </button>
          </nav>
        </div>
      </div>

      {/* 熱門遊戲內容 */}
      {activeTab === "games" && (
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-2 text-xl font-semibold">遊戲名稱</h3>
              <p className="mb-4 text-gray-600">遊戲簡介...</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">2-4 人</span>
                <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                  加入遊戲
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 遊戲房間內容 */}
      {activeTab === "rooms" && (
        <section className="mb-8">
          <div className="flex justify-end mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                建立房間
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                加入房間
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8">載入中...</div>
            ) : rooms.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                目前沒有可用的房間
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                  <p className="text-gray-600 mb-4">房間代碼: {room.id}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {room.currentPlayers}/{room.maxPlayers} 人
                    </span>
                    <button
                      onClick={() => router.push(`/game/${room.id}`)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      加入
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 建立房間的 Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">建立新房間</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  房間名稱
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="輸入房間名稱"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  最大玩家數（狼人殺需要 10 人）
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="10">10 人（狼人殺）</option>
                  <option value="2">2 人</option>
                  <option value="4">4 人</option>
                  <option value="6">6 人</option>
                  <option value="8">8 人</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 加入房間的 Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">加入房間</h2>
            <form onSubmit={handleJoinRoom}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  房間代碼
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="輸入 6 位數房間代碼"
                  maxLength={6}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  加入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
