/**
 * Socket.IO 伺服器
 * 處理遊戲房間的即時通訊和遊戲狀態同步
 */

import { Server } from "socket.io";
import http from "http";
import { PrismaClient } from "./src/generated/prisma";
import {
  initializeGame,
  applyAction,
  getPlayerView,
  checkVictory,
  type GameState,
} from "./src/lib/games/werewolf/engine";

const prisma = new PrismaClient();

// 遊戲狀態管理：Map<roomId, GameState>
const gameStates = new Map<string, GameState>();

// 玩家資訊管理：Map<socketId, { playerId, roomId, nickname }>
interface PlayerInfo {
  playerId: string;
  roomId: string;
  nickname: string;
}
const playerInfo = new Map<string, PlayerInfo>();

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/socket.io",
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("connection-confirmed", { id: socket.id });

  // 玩家加入房間（現場模式）
  socket.on("join-room", async (data: { roomId: string; playerId: string; nickname: string }) => {
    const { roomId, playerId, nickname } = data;
    console.log(`Client ${socket.id} (playerId: ${playerId}) joining room ${roomId}`);

    if (!roomId || !playerId || !nickname) {
      socket.emit("error", { message: "缺少必要參數：roomId, playerId, nickname" });
      return;
    }

    try {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        socket.emit("error", { message: "房間不存在" });
        return;
      }

      const players = (room.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
      const gameState = gameStates.get(roomId);

      // 如果遊戲已開始，不允許新玩家加入
      if (gameState && gameState.phase !== "setup") {
        socket.emit("error", { message: "遊戲已開始，無法加入" });
        return;
      }

      // 檢查玩家是否已在房間中
      const existingPlayer = players.find((p) => p.playerId === playerId);

      if (!existingPlayer) {
        // 檢查房間是否已滿
        if (players.length >= room.maxPlayers) {
          socket.emit("error", { message: "房間已滿" });
          return;
        }

        // 添加玩家到房間
        const newPlayer = { playerId, socketId: socket.id, nickname };
        const updatedPlayers = [...players, newPlayer];

        await prisma.room.update({
          where: { id: roomId },
          data: {
            players: updatedPlayers as unknown as any,
            lastActivity: new Date(),
          },
        });
      }

      // 記錄玩家資訊
      playerInfo.set(socket.id, { playerId, roomId, nickname });

      socket.join(roomId);

      // 如果已有遊戲狀態，發送當前狀態給新加入的玩家
      if (gameState) {
        const view = getPlayerView(gameState, playerId);
        socket.emit("game:state", view);
      } else {
        // 發送房間資訊
        const roomData = await prisma.room.findUnique({ where: { id: roomId } });
        socket.emit("room:joined", {
          roomId,
          players: (roomData?.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [],
          maxPlayers: roomData?.maxPlayers || 10,
        });
      }

      // 通知房間內其他玩家
      socket.to(roomId).emit("user-joined", { roomId, playerId, nickname });
    } catch (error) {
      console.error(`Failed to join room ${roomId}:`, error);
      socket.emit("error", { message: "加入房間失敗" });
    }
  });

  // 玩家離開房間
  socket.on("leave-room", async (roomId: string) => {
    console.log(`Client ${socket.id} leaving room ${roomId}`);
    const info = playerInfo.get(socket.id);
    socket.leave(roomId);

    if (info) {
      try {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (room) {
          const players = (room.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
          const updatedPlayers = players.filter((p) => p.playerId !== info.playerId);

          await prisma.room.update({
            where: { id: roomId },
            data: {
              players: updatedPlayers as unknown as any,
              lastActivity: new Date(),
            },
          });
        }
        playerInfo.delete(socket.id);
        io.to(roomId).emit("user-left", { roomId, playerId: info.playerId });
      } catch (error) {
        console.error(`Failed to leave room ${roomId}:`, error);
      }
    }
  });

  // 開始遊戲（僅房主可執行）
  socket.on("game:start", async (data: { roomId: string }) => {
    const { roomId } = data;
    const info = playerInfo.get(socket.id);

    if (!info || info.roomId !== roomId) {
      socket.emit("error", { message: "無權限開始遊戲" });
      return;
    }

    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        socket.emit("error", { message: "房間不存在" });
        return;
      }

      const players = (room.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
      if (players.length !== 10) {
        socket.emit("error", { message: "需要正好 10 位玩家才能開始遊戲" });
        return;
      }

      // 初始化遊戲
      const playerList = players.map((p) => ({
        playerId: p.playerId,
        socketId: p.socketId,
        nickname: p.nickname,
      }));

      const gameState = initializeGame(roomId, playerList);
      gameStates.set(roomId, gameState);

      // 進入角色揭示階段
      gameState.step = "setup:reveal_roles";

      // 向所有玩家發送遊戲狀態
      for (const player of playerList) {
        const view = getPlayerView(gameState, player.playerId);
        io.to(player.socketId).emit("game:state", view);
      }

      console.log(`Game started in room ${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to start game in room ${roomId}:`, error);
      socket.emit("error", { message: "開始遊戲失敗: " + errorMessage });
    }
  });

  // 玩家執行遊戲操作
  socket.on("game:action", (data: { roomId: string; action: { type: string; payload?: Record<string, unknown> } }) => {
    const { roomId, action } = data;
    const info = playerInfo.get(socket.id);

    if (!info || info.roomId !== roomId) {
      socket.emit("error", { message: "無權限執行操作" });
      return;
    }

    const gameState = gameStates.get(roomId);
    if (!gameState) {
      socket.emit("error", { message: "遊戲尚未開始" });
      return;
    }

    if (gameState.phase === "finished") {
      socket.emit("error", { message: "遊戲已結束" });
      return;
    }

    try {
      // 構建完整的 action 物件
      const fullAction = {
        type: action.type,
        playerId: info.playerId,
        payload: action.payload || {},
        timestamp: Date.now(),
      };

      // 特殊處理：獵人查看手勢（自動觸發）
      if (gameState.step === "night:hunter_check_gesture" && action.type === "hunter:check_gesture") {
        const player = gameState.players.find((p) => p.playerId === info.playerId);
        if (player && player.role === "hunter") {
          // 檢查是否被毒
          const isPoisoned = gameState.nightResult?.killedByPoison === info.playerId;
          player.hunterGesture = isPoisoned ? "bad" : "good";
          if (gameState.nightResult) {
            gameState.nightResult.hunterGesture = {
              playerId: info.playerId,
              gesture: player.hunterGesture,
            };
          }
          // 自動進入下一階段
          if (gameState.phase === "night_first") {
            gameState.step = "sheriff:collect_candidates";
            gameState.phase = "sheriff_election";
            gameState.sheriffElection = {
              candidates: [],
              speechOrder: [],
              currentSpeechIndex: 0,
              votes: {},
            };
          } else {
            gameState.step = "day:apply_night_deaths";
            gameState.phase = "day";
          }
        }
      } else {
        // 應用操作
        const newState = applyAction(gameState, fullAction);
        gameStates.set(roomId, newState);

        // 檢查勝負
        const winner = checkVictory(newState);
        if (winner) {
          newState.winner = winner;
          newState.phase = "finished";
          newState.step = null;
        }
      }

      // 處理自動步驟推進
      const currentState = gameStates.get(roomId);
      if (currentState) {
        let shouldContinue = true;
        while (shouldContinue && currentState.step) {
          shouldContinue = false;
          
          // 自動執行 day:apply_night_deaths
          if (currentState.step === "day:apply_night_deaths") {
            const autoAction = {
              type: "day:apply_night_deaths",
              playerId: "system",
              payload: {},
              timestamp: Date.now(),
            };
            const newState = applyAction(currentState, autoAction);
            gameStates.set(roomId, newState);
            shouldContinue = true;
          }
          
          // 自動執行 day:announce_deaths
          if (currentState.step === "day:announce_deaths") {
            const autoAction = {
              type: "day:announce_deaths",
              playerId: "system",
              payload: {},
              timestamp: Date.now(),
            };
            const newState = applyAction(currentState, autoAction);
            gameStates.set(roomId, newState);
            shouldContinue = true;
          }
          
          // 自動執行 day:speeches（簡化為直接進入投票）
          if (currentState.step === "day:speeches") {
            currentState.step = "day:voting";
            currentState.dayVoting = {
              votes: {},
              finished: false,
            };
            gameStates.set(roomId, currentState);
            shouldContinue = false;
          }
        }
      }

      // 向所有玩家發送更新後的遊戲狀態
      const finalState = gameStates.get(roomId);
      if (finalState) {
        for (const player of finalState.players) {
          const view = getPlayerView(finalState, player.playerId);
          io.to(player.socketId).emit("game:state", view);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to apply action in room ${roomId}:`, error);
      socket.emit("error", { message: "操作失敗: " + errorMessage });
    }
  });

  socket.on("chat-message", ({ message, roomId }: { message: string; roomId: string }) => {
    const messageData = {
      id: socket.id,
      message,
      timestamp: new Date().toISOString(),
    };
    io.to(roomId).emit("chat-message", messageData);
  });

  socket.on("ready", ({ roomId }: { roomId: string }) => {
    socket.to(roomId).emit("user-ready", socket.id);
  });

  socket.on("signal", ({ signal, to, from }: { signal: unknown; to: string; from: string }) => {
    io.to(to).emit("signal", { signal, from });
  });

  socket.on("disconnect", async () => {
    try {
      const info = playerInfo.get(socket.id);
      if (info) {
        const roomId = info.roomId;
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (room) {
          const players = (room.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
          const updatedPlayers = players.filter((p) => p.playerId !== info.playerId);

          await prisma.room.update({
            where: { id: roomId },
            data: {
              players: updatedPlayers as unknown as any,
              lastActivity: new Date(),
            },
          });
        }
        playerInfo.delete(socket.id);
        io.to(roomId).emit("user-left", { roomId, playerId: info.playerId });
      }
    } catch (error) {
      console.error(`Failed to handle disconnect for ${socket.id}:`, error);
    }
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4001;
const HOST = process.env.HOST || "0.0.0.0"; // 監聽所有網路介面

server.listen(PORT, HOST, () => {
  console.log("Socket.IO server running");
  console.log(`  Local:   ws://localhost:${PORT}`);
  console.log(`  Network: ws://<your-local-ip>:${PORT}`);
  console.log(`\n  To find your local IP:`);
  console.log(`    macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1`);
  console.log(`    Windows: ipconfig`);
});

// 優雅關閉
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing Prisma connection...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing Prisma connection...");
  await prisma.$disconnect();
  process.exit(0);
});
