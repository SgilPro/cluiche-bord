import { NextResponse } from "next/server";
import {
  createRoom,
  getAvailableRooms,
  deleteRoom,
  cleanupInactiveRooms,
  type CreateRoomData,
} from "@/lib/db/rooms";

// 追蹤最後清理時間，避免過於頻繁的清理
let lastCleanupTime: Date | null = null;
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 分鐘

/**
 * 執行房間清理（如果需要）
 */
async function performCleanupIfNeeded() {
  const now = new Date();
  
  // 如果距離上次清理不到 1 分鐘，跳過
  if (lastCleanupTime && now.getTime() - lastCleanupTime.getTime() < CLEANUP_INTERVAL_MS) {
    return;
  }

  try {
    const deletedCount = await cleanupInactiveRooms();
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} inactive rooms`);
    }
    lastCleanupTime = now;
  } catch (error) {
    console.error("Failed to cleanup rooms:", error);
  }
}

/**
 * POST /api/rooms - 建立新房間
 */
export async function POST(req: Request) {
  try {
    const { name, maxPlayers } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Room name is required" },
        { status: 400 }
      );
    }

    if (!maxPlayers || typeof maxPlayers !== "number" || maxPlayers < 2) {
      return NextResponse.json(
        { success: false, error: "maxPlayers must be at least 2" },
        { status: 400 }
      );
    }

    const roomData: CreateRoomData = {
      name: name.trim(),
      maxPlayers,
    };

    const newRoom = await createRoom(roomData);

    return NextResponse.json({
      success: true,
      room: {
        id: newRoom.id,
        name: newRoom.name,
        maxPlayers: newRoom.maxPlayers,
        players: newRoom.players,
        createdAt: newRoom.createdAt.toISOString(),
        lastActivity: newRoom.lastActivity.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rooms - 取得可用房間列表
 */
export async function GET() {
  try {
    // 執行清理（如果需要）
    await performCleanupIfNeeded();

    // 取得可用房間列表
    const rooms = await getAvailableRooms();

    return NextResponse.json({
      success: true,
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        currentPlayers: room.currentPlayers,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rooms - 刪除房間
 */
export async function DELETE(req: Request) {
  try {
    const { roomId } = await req.json();

    if (!roomId || typeof roomId !== "string") {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteRoom(roomId);

    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
