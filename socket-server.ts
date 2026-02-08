/**
 * Socket.IO 伺服器
 * 處理遊戲房間的即時通訊和遊戲狀態同步
 */

import http from "http";
import { Server } from "socket.io";
import { PrismaClient } from "./src/generated/prisma";
import {
    applyAction,
    checkVictory,
    getPlayerView,
    initializeGame,
    type GameState,
} from "./src/lib/games/werewolf/engine";

// 針對 Supabase connection pooler 的 prepared statement 問題
// 解決方案：使用 direct connection (DIRECT_URL) 而不是 pooler
// Direct connection 支援 prepared statements，不會有 "prepared statement already exists" 錯誤
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

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

      // 檢查玩家是否已在房間中（檢查資料庫或遊戲狀態）
      const existingPlayer = players.find((p) => p.playerId === playerId);
      // 如果遊戲已開始，也檢查遊戲狀態中是否有這個玩家
      const playerInGame = gameState?.players.find((p) => p.playerId === playerId);

      if (!existingPlayer && !playerInGame) {
        // 這是新玩家，檢查是否可以加入
        // 如果遊戲已開始，不允許新玩家加入
        if (gameState && gameState.phase !== "setup") {
          socket.emit("error", { message: "遊戲已開始，無法加入" });
          return;
        }

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
      } else {
        // 玩家原本就在房間中，更新 socketId（重新連線）
        let updatedPlayers = players;
        
        // 如果玩家在資料庫中，更新 socketId
        if (existingPlayer) {
          updatedPlayers = players.map((p) =>
            p.playerId === playerId ? { ...p, socketId: socket.id } : p
          );
        } else if (playerInGame) {
          // 如果玩家在遊戲狀態中但不在資料庫中（重新連線），添加到資料庫
          // 從遊戲狀態中取得玩家的 nickname
          const gamePlayer = gameState.players.find((p) => p.playerId === playerId);
          const playerNickname = gamePlayer?.nickname || nickname;
          updatedPlayers = [...players, { playerId, socketId: socket.id, nickname: playerNickname }];
          
          // 同時更新遊戲狀態中的 socketId
          if (gamePlayer) {
            gamePlayer.socketId = socket.id;
            gameStates.set(roomId, gameState);
          }
        }

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

      // 取得更新後的房間資訊（重新查詢以確保取得最新資料）
      const roomData = await prisma.room.findUnique({ where: { id: roomId } });
      let updatedPlayers = (roomData?.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
      
      // 確保 updatedPlayers 包含所有玩家（包括在遊戲狀態中但不在資料庫中的玩家）
      if (gameState) {
        const gamePlayerIds = new Set(gameState.players.map(p => p.playerId));
        const dbPlayerIds = new Set(updatedPlayers.map(p => p.playerId));
        const missingPlayers: Array<{ playerId: string; socketId: string; nickname: string }> = [];
        
        // 找出在遊戲狀態中但不在資料庫中的玩家
        for (const gamePlayer of gameState.players) {
          if (!dbPlayerIds.has(gamePlayer.playerId)) {
            // 檢查這個玩家是否就是當前加入的玩家
            if (gamePlayer.playerId === playerId) {
              // 使用當前加入的玩家的 socketId 和 nickname
              missingPlayers.push({ playerId: gamePlayer.playerId, socketId: socket.id, nickname });
            } else {
              // 使用遊戲狀態中的 socketId（可能是舊的，但至少能顯示玩家）
              // 嘗試從 playerInfo 中找到最新的 socketId
              let latestSocketId = gamePlayer.socketId || `unknown_${gamePlayer.playerId}`;
              for (const [sockId, info] of playerInfo.entries()) {
                if (info.playerId === gamePlayer.playerId && info.roomId === roomId) {
                  latestSocketId = sockId;
                  break;
                }
              }
              missingPlayers.push({ 
                playerId: gamePlayer.playerId, 
                socketId: latestSocketId, 
                nickname: gamePlayer.nickname 
              });
            }
          }
        }
        
        // 如果有缺失的玩家，添加到 updatedPlayers 並更新資料庫
        if (missingPlayers.length > 0) {
          updatedPlayers = [...updatedPlayers, ...missingPlayers];
          await prisma.room.update({
            where: { id: roomId },
            data: {
              players: updatedPlayers as unknown as any,
              lastActivity: new Date(),
            },
          });
        }
      }
      
      // 判斷房主：
      // 1. 如果房間還沒有房主（hostPlayerId 為 null），且這是第一個玩家，設為房主
      // 2. 否則使用資料庫中的 hostPlayerId
      let hostPlayerId: string | null = roomData?.hostPlayerId || null;
      
      if (!hostPlayerId && updatedPlayers.length > 0) {
        // 第一個加入的玩家成為房主
        hostPlayerId = updatedPlayers[0].playerId;
        
        // 更新資料庫中的 hostPlayerId
        await prisma.room.update({
          where: { id: roomId },
          data: { hostPlayerId },
        });
      }

      // 如果已有遊戲狀態，先發送遊戲狀態，再發送房間資訊
      // 這樣前端可以正確判斷遊戲是否已開始
      if (gameState) {
        const view = getPlayerView(gameState, playerId, hostPlayerId || undefined);
        // 先發送遊戲狀態，確保前端知道遊戲已開始
        socket.emit("game:state", view);
        // 使用 setTimeout 確保 game:state 事件先被處理
        setTimeout(() => {
          socket.emit("room:joined", {
            roomId,
            players: updatedPlayers,
            maxPlayers: roomData?.maxPlayers || 10,
            hostPlayerId,
            gameStarted: true, // 標記遊戲已開始
          });
        }, 50);
      } else {
        // 發送房間資訊給新加入的玩家
        socket.emit("room:joined", {
          roomId,
          players: updatedPlayers,
          maxPlayers: roomData?.maxPlayers || 10,
          hostPlayerId,
          gameStarted: false, // 標記遊戲未開始
        });
      }

      // 廣播房間更新給所有房間內的玩家（包括新加入的玩家）
      // 這樣所有玩家都能即時看到最新的玩家列表
      io.to(roomId).emit("room:updated", {
        roomId,
        players: updatedPlayers,
        maxPlayers: roomData?.maxPlayers || 10,
        hostPlayerId,
        gameStarted: !!gameState, // 標記遊戲是否已開始
      });

      // 通知房間內其他玩家有新玩家加入（保留以備未來需要）
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

          // 取得更新後的房間資訊
          const roomData = await prisma.room.findUnique({ where: { id: roomId } });
          const finalPlayers = (roomData?.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
          
          // 保持 hostPlayerId 不變（不自動轉移房主）
          // 只有在所有人都離開時，才清空 hostPlayerId（這樣下一個加入的人可以成為新房主）
          let hostPlayerId: string | null = roomData?.hostPlayerId || null;
          
          if (finalPlayers.length === 0) {
            // 所有人都離開了，清空 hostPlayerId（這樣下一個加入的人可以成為新房主）
            hostPlayerId = null;
            await prisma.room.update({
              where: { id: roomId },
              data: { hostPlayerId: null },
            });
          }
          // 否則保持 hostPlayerId 不變，即使原房主已經離開

          // 廣播房間更新給所有房間內的玩家
          io.to(roomId).emit("room:updated", {
            roomId,
            players: finalPlayers,
            maxPlayers: roomData?.maxPlayers || 10,
            hostPlayerId, // 保持原房主 ID，不自動轉移
          });
        }
        playerInfo.delete(socket.id);
        // 保留 user-left 事件以備未來需要
        io.to(roomId).emit("user-left", { roomId, playerId: info.playerId });
      } catch (error) {
        console.error(`Failed to leave room ${roomId}:`, error);
      }
    }
  });

  // 轉移房主（僅房主可執行）
  socket.on("room:transfer-host", async (data: { roomId: string; newHostPlayerId: string }) => {
    const { roomId, newHostPlayerId } = data;
    const info = playerInfo.get(socket.id);

    if (!info || info.roomId !== roomId) {
      socket.emit("error", { message: "無權限轉移房主" });
      return;
    }

    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        socket.emit("error", { message: "房間不存在" });
        return;
      }

      // 檢查是否為房主
      if (room.hostPlayerId !== info.playerId) {
        socket.emit("error", { message: "只有房主可以轉移房主權限" });
        return;
      }

      // 檢查新房主是否在房間中
      const players = (room.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
      const newHostExists = players.some((p) => p.playerId === newHostPlayerId);
      
      if (!newHostExists) {
        socket.emit("error", { message: "指定的玩家不在房間中" });
        return;
      }

      // 更新房主
      await prisma.room.update({
        where: { id: roomId },
        data: { hostPlayerId: newHostPlayerId },
      });

      // 廣播房間更新給所有房間內的玩家
      io.to(roomId).emit("room:updated", {
        roomId,
        players,
        maxPlayers: room.maxPlayers,
        hostPlayerId: newHostPlayerId,
      });

      console.log(`Host transferred from ${info.playerId} to ${newHostPlayerId} in room ${roomId}`);
    } catch (error) {
      console.error(`Failed to transfer host in room ${roomId}:`, error);
      socket.emit("error", { message: "轉移房主失敗" });
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
      // 確保 readyPlayers 被初始化（雖然 initializeGame 已經初始化了，但為了安全起見）
      if (!gameState.readyPlayers) {
        gameState.readyPlayers = [];
      }

      // 取得房主 playerId
      const hostPlayerId = room?.hostPlayerId || playerList[0]?.playerId || null;
      
      // 向所有玩家發送遊戲狀態
      for (const player of playerList) {
        const view = getPlayerView(gameState, player.playerId, hostPlayerId || undefined);
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
  socket.on("game:action", async (data: { roomId: string; action: { type: string; payload?: Record<string, unknown> } }) => {
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

      // 應用操作（包括獵人查看手勢，統一使用 applyAction 處理）
      {
        // 對於需要 hostPlayerId 驗證的操作，先驗證
        if (action.type === "sheriff:confirm_collect" || action.type === "sheriff:confirm_withdraw") {
          const roomData = await prisma.room.findUnique({ where: { id: roomId } });
          const hostPlayerId = roomData?.hostPlayerId || null;
          if (hostPlayerId !== info.playerId) {
            socket.emit("error", { message: "只有房主可以確認" });
            return;
          }
        }
        
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
        // 取得房主 playerId
        const roomData = await prisma.room.findUnique({ where: { id: roomId } });
        const hostPlayerId = roomData?.hostPlayerId || null;
        
        // 更新遊戲狀態中玩家的 socketId（確保使用最新的 socketId）
        for (const player of finalState.players) {
          // 從 playerInfo Map 中查找最新的 socketId
          for (const [sockId, info] of playerInfo.entries()) {
            if (info.playerId === player.playerId && info.roomId === roomId) {
              player.socketId = sockId;
              break;
            }
          }
        }
        
        // 向房間內的所有玩家發送更新後的遊戲狀態
        // 為每個玩家發送對應的視圖
        for (const player of finalState.players) {
          const view = getPlayerView(finalState, player.playerId, hostPlayerId || undefined);
          // 使用最新的 socketId 發送
          const latestSocketId = player.socketId;
          if (latestSocketId) {
            io.to(latestSocketId).emit("game:state", view);
          }
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

          // 取得更新後的房間資訊
          const roomData = await prisma.room.findUnique({ where: { id: roomId } });
          const finalPlayers = (roomData?.players as Array<{ playerId: string; socketId: string; nickname: string }>) || [];
          
          // 保持 hostPlayerId 不變（不自動轉移房主）
          // 只有在所有人都離開時，才清空 hostPlayerId（這樣下一個加入的人可以成為新房主）
          let hostPlayerId: string | null = roomData?.hostPlayerId || null;
          
          if (finalPlayers.length === 0) {
            // 所有人都離開了，清空 hostPlayerId（這樣下一個加入的人可以成為新房主）
            hostPlayerId = null;
            await prisma.room.update({
              where: { id: roomId },
              data: { hostPlayerId: null },
            });
          }
          // 否則保持 hostPlayerId 不變，即使原房主已經離開

          // 廣播房間更新給所有房間內的玩家
          io.to(roomId).emit("room:updated", {
            roomId,
            players: finalPlayers,
            maxPlayers: roomData?.maxPlayers || 10,
            hostPlayerId, // 保持原房主 ID，不自動轉移
          });
        }
        playerInfo.delete(socket.id);
        // 保留 user-left 事件以備未來需要
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
