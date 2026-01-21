/**
 * 房間資料庫操作層
 * 
 * 提供房間的 CRUD 操作，使用 Prisma 與資料庫互動
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface RoomData {
  id: string;
  name: string;
  maxPlayers: number;
  players: string[];
  createdAt: Date;
  lastActivity: Date;
}

export interface CreateRoomData {
  name: string;
  maxPlayers: number;
}

export interface RoomListItem {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: Date;
}

/**
 * 生成唯一的 6 位數房間代碼
 */
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * 確保房間 ID 唯一
 */
async function ensureUniqueRoomId(): Promise<string> {
  let roomId = generateRoomId();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!existing) {
      return roomId;
    }

    roomId = generateRoomId();
    attempts++;
  }

  throw new Error('Failed to generate unique room ID');
}

/**
 * 建立新房間
 */
export async function createRoom(data: CreateRoomData): Promise<RoomData> {
  const roomId = await ensureUniqueRoomId();

  const room = await prisma.room.create({
    data: {
      id: roomId,
      name: data.name,
      maxPlayers: data.maxPlayers,
      players: [],
      lastActivity: new Date(),
    },
  });

  return {
    id: room.id,
    name: room.name,
    maxPlayers: room.maxPlayers,
    players: room.players as string[],
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
  };
}

/**
 * 取得可用房間列表（未滿的房間）
 */
export async function getAvailableRooms(): Promise<RoomListItem[]> {
  const rooms = await prisma.room.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return rooms
    .filter((room) => {
      const players = room.players as string[];
      return players.length < room.maxPlayers;
    })
    .map((room) => ({
      id: room.id,
      name: room.name,
      currentPlayers: (room.players as string[]).length,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
    }));
}

/**
 * 取得單一房間
 */
export async function getRoomById(roomId: string): Promise<RoomData | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    return null;
  }

  return {
    id: room.id,
    name: room.name,
    maxPlayers: room.maxPlayers,
    players: room.players as string[],
    createdAt: room.createdAt,
    lastActivity: room.lastActivity,
  };
}

/**
 * 更新房間活動時間
 */
export async function updateRoomActivity(roomId: string): Promise<void> {
  await prisma.room.update({
    where: { id: roomId },
    data: { lastActivity: new Date() },
  });
}

/**
 * 更新房間玩家列表
 */
export async function updateRoomPlayers(
  roomId: string,
  playerId: string,
  isJoining: boolean
): Promise<void> {
  const room = await getRoomById(roomId);
  if (!room) {
    throw new Error(`Room ${roomId} not found`);
  }

  const players = [...room.players];

  if (isJoining) {
    if (!players.includes(playerId)) {
      players.push(playerId);
    }
  } else {
    const index = players.indexOf(playerId);
    if (index > -1) {
      players.splice(index, 1);
    }
  }

  await prisma.room.update({
    where: { id: roomId },
    data: {
      players,
      lastActivity: new Date(),
    },
  });
}

/**
 * 刪除房間
 */
export async function deleteRoom(roomId: string): Promise<boolean> {
  try {
    await prisma.room.delete({
      where: { id: roomId },
    });
    return true;
  } catch (error) {
    console.error(`Failed to delete room ${roomId}:`, error);
    return false;
  }
}

/**
 * 清理空房間
 * 
 * 刪除符合以下條件的房間：
 * - 沒有玩家
 * - 且最後活動時間超過 5 分鐘
 * - 或建立時間超過 10 分鐘
 */
export async function cleanupInactiveRooms(): Promise<number> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // 查詢所有房間（Prisma 的 JSON 查詢較複雜，我們先取得所有房間再過濾）
  const allRooms = await prisma.room.findMany();
  
  // 過濾出空房間
  const emptyRooms = allRooms.filter((room) => {
    const players = room.players as string[];
    return players.length === 0;
  });

  // 過濾需要刪除的房間
  const roomsToDelete = emptyRooms.filter((room) => {
    const players = room.players as string[];
    
    // 如果有玩家，保留
    if (players.length > 0) {
      return false;
    }

    // 如果最後活動時間在 5 分鐘內，保留
    if (room.lastActivity > fiveMinutesAgo) {
      return false;
    }

    // 如果建立時間在 10 分鐘內，保留
    if (room.createdAt > tenMinutesAgo) {
      return false;
    }

    return true;
  });

  // 刪除符合條件的房間
  if (roomsToDelete.length > 0) {
    await prisma.room.deleteMany({
      where: {
        id: {
          in: roomsToDelete.map((r) => r.id),
        },
      },
    });
  }

  return roomsToDelete.length;
}
