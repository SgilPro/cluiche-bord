import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  players: string[];
  createdAt: string;
  lastActivity: string;
}

const ROOMS_FILE = path.join(process.cwd(), "data", "rooms.json");
const CLEANUP_FILE = path.join(process.cwd(), "data", "last_cleanup.json");

// 確保 data 目錄存在
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"));
}

// 如果檔案不存在，建立必要的檔案
if (!fs.existsSync(ROOMS_FILE)) {
  fs.writeFileSync(ROOMS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(CLEANUP_FILE)) {
  fs.writeFileSync(
    CLEANUP_FILE,
    JSON.stringify({ lastCleanup: new Date().toISOString() })
  );
}

// 讀取房間列表
const readRooms = (): Room[] => {
  try {
    const data = fs.readFileSync(ROOMS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read rooms:", error);
    return [];
  }
};

// 寫入房間列表
const writeRooms = (rooms: Room[]) => {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
  } catch (error) {
    console.error("Failed to write rooms:", error);
  }
};

// 讀取最後清理時間
const readLastCleanup = (): Date => {
  try {
    const data = fs.readFileSync(CLEANUP_FILE, "utf-8");
    const { lastCleanup } = JSON.parse(data);
    return new Date(lastCleanup);
  } catch (error) {
    console.error("Failed to read last cleanup time:", error);
    return new Date(0);
  }
};

// 更新最後清理時間
const updateLastCleanup = () => {
  try {
    fs.writeFileSync(
      CLEANUP_FILE,
      JSON.stringify({ lastCleanup: new Date().toISOString() })
    );
  } catch (error) {
    console.error("Failed to update last cleanup time:", error);
  }
};

// 清理空房間
const cleanupRooms = () => {
  const lastCleanup = readLastCleanup();
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  console.log("Last cleanup time:", lastCleanup.toISOString());
  console.log("Current time:", now.toISOString());
  console.log("One minute ago:", oneMinuteAgo.toISOString());

  // 如果距離上次清理不到 1 分鐘，跳過
  if (lastCleanup > oneMinuteAgo) {
    console.log("Skipping cleanup - last cleanup was less than 1 minute ago");
    return;
  }

  console.log("Starting room cleanup...");
  const rooms = readRooms();
  console.log("Total rooms before cleanup:", rooms.length);

  const activeRooms = rooms.filter((room) => {
    // 如果房間有玩家，保留
    if (room.players.length > 0) {
      console.log(
        `Room ${room.id} has ${room.players.length} players - keeping`
      );
      return true;
    }

    // 檢查最後活動時間
    const lastActivity = new Date(room.lastActivity);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 如果最後活動時間在 5 分鐘內，保留
    if (lastActivity > fiveMinutesAgo) {
      console.log(`Room ${room.id} was active in last 5 minutes - keeping`);
      return true;
    }

    // 如果房間創建時間在 10 分鐘內，保留
    const createdAt = new Date(room.createdAt);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const shouldKeep = createdAt > tenMinutesAgo;
    console.log(
      `Room ${room.id} created ${
        shouldKeep ? "less" : "more"
      } than 10 minutes ago - ${shouldKeep ? "keeping" : "removing"}`
    );
    return shouldKeep;
  });

  if (activeRooms.length !== rooms.length) {
    console.log(
      `Cleaned up ${rooms.length - activeRooms.length} inactive rooms`
    );
    writeRooms(activeRooms);
    updateLastCleanup();
    console.log("Cleanup completed and last cleanup time updated");
  } else {
    console.log("No rooms needed cleanup");
  }
};

// 設定定期清理
let cleanupInterval: NodeJS.Timeout | null = null;

const startCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  // 每 1 分鐘執行一次清理
  cleanupInterval = setInterval(cleanupRooms, 60 * 1000);
};

// 在伺服器啟動時開始定期清理
startCleanupInterval();

// 確保在伺服器關閉時清理 interval
process.on("SIGTERM", () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
});

// 更新房間活動時間
const updateRoomActivity = (roomId: string) => {
  const rooms = readRooms();
  const roomIndex = rooms.findIndex((room) => room.id === roomId);
  if (roomIndex !== -1) {
    rooms[roomIndex].lastActivity = new Date().toISOString();
    writeRooms(rooms);
  }
};

export async function POST(req: Request) {
  try {
    const { name, maxPlayers } = await req.json();

    // 生成 6 位數的房間代碼
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 讀取現有房間
    const rooms = readRooms();

    // 建立新房間
    const newRoom: Room = {
      id,
      name,
      maxPlayers,
      players: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    // 新增房間到列表
    rooms.push(newRoom);

    // 儲存更新後的房間列表
    writeRooms(rooms);

    return NextResponse.json({
      success: true,
      room: newRoom,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create room" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("GET /api/rooms called");

    // 執行清理
    console.log("Checking if cleanup is needed...");
    cleanupRooms();

    // 讀取房間列表
    const rooms = readRooms();
    console.log("Current rooms:", rooms);

    // 過濾掉已滿的房間並轉換格式
    const availableRooms = rooms
      .filter((room) => room.players.length < room.maxPlayers)
      .map((room) => ({
        id: room.id,
        name: room.name,
        currentPlayers: room.players.length,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt,
      }));

    console.log("Available rooms:", availableRooms);

    return NextResponse.json({
      success: true,
      rooms: availableRooms,
    });
  } catch (error) {
    console.error("Error in GET /api/rooms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// 新增刪除房間的 API
export async function DELETE(req: Request) {
  try {
    const { roomId } = await req.json();
    const rooms = readRooms();
    const updatedRooms = rooms.filter((room) => room.id !== roomId);

    if (updatedRooms.length !== rooms.length) {
      writeRooms(updatedRooms);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Room not found" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
