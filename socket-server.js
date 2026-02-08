const { Server } = require("socket.io");
const http = require("http");
const { PrismaClient } = require("./src/generated/prisma");
const {
  initializeGame,
  applyAction,
  getPlayerView,
  checkVictory,
} = require("./src/lib/games/werewolf/engine");

// 針對 Supabase connection pooler，需要禁用 prepared statements
// 這可以通過在 DATABASE_URL 中加入 ?pgbouncer=true 來解決
// 或者使用 direct connection 而不是 pooler
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

// 遊戲狀態管理：Map<roomId, GameState>
const gameStates = new Map();

// 玩家資訊管理：Map<socketId, { playerId, roomId, nickname }>
const playerInfo = new Map();

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

/**
 * 更新房間玩家列表
 */
async function updateRoomPlayers(roomId, playerId, isJoining) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      console.error(`Room ${roomId} not found`);
      return;
    }

    const players = [...(room.players || [])];

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
  } catch (error) {
    console.error(`Failed to update room players for room ${roomId}:`, error);
  }
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("connection-confirmed", { id: socket.id });

  // 玩家加入房間（現場模式）
  socket.on("join-room", async (data) => {
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

      const players = room.players || [];
      const gameState = gameStates.get(roomId);

      // 如果遊戲已開始，不允許新玩家加入
      if (gameState && gameState.phase !== "setup") {
        socket.emit("error", { message: "遊戲已開始，無法加入" });
        return;
      }

      // 檢查玩家是否已在房間中
      const existingPlayer = Array.isArray(players) 
        ? players.find((p) => typeof p === "object" && p.playerId === playerId)
        : null;

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
            players: updatedPlayers,
            lastActivity: new Date(),
          },
        });
      }

      // 記錄玩家資訊
      playerInfo.set(socket.id, { playerId, roomId, nickname });

      socket.join(roomId);
      
      // 取得更新後的房間資訊
      const updatedRoom = await prisma.room.findUnique({ where: { id: roomId } });
      const updatedPlayers = updatedRoom.players || [];
      
      // 判斷房主：第一個加入的玩家（players 陣列的第一個）
      // 處理 players 可能是物件陣列的情況
      let hostPlayerId = null;
      if (Array.isArray(updatedPlayers) && updatedPlayers.length > 0) {
        const firstPlayer = updatedPlayers[0];
        if (typeof firstPlayer === "object" && firstPlayer !== null && firstPlayer.playerId) {
          hostPlayerId = firstPlayer.playerId;
        }
      }

      // 如果已有遊戲狀態，發送當前狀態給新加入的玩家
      if (gameState) {
        const view = getPlayerView(gameState, playerId);
        socket.emit("game:state", view);
      } else {
        // 發送房間資訊（包含房主資訊）
        socket.emit("room:joined", {
          roomId,
          players: updatedPlayers,
          maxPlayers: updatedRoom.maxPlayers,
          hostPlayerId,
        });
      }

      // 廣播房間更新給所有房間內的玩家（包括新加入的玩家）
      io.to(roomId).emit("room:updated", {
        roomId,
        players: updatedPlayers,
        maxPlayers: updatedRoom.maxPlayers,
        hostPlayerId,
      });

      // 通知房間內其他玩家有新玩家加入
      socket.to(roomId).emit("user-joined", { roomId, playerId, nickname });
    } catch (error) {
      console.error(`Failed to join room ${roomId}:`, error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        roomId,
        playerId,
        nickname
      });
      socket.emit("error", { 
        message: "加入房間失敗",
        details: error?.message || "Unknown error"
      });
    }
  });

  // 玩家離開房間
  socket.on("leave-room", async (roomId) => {
    console.log(`Client ${socket.id} leaving room ${roomId}`);
    const info = playerInfo.get(socket.id);
    socket.leave(roomId);
    
    if (info) {
      try {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (room) {
          const players = room.players || [];
          const updatedPlayers = Array.isArray(players)
            ? players.filter((p) => typeof p === "object" && p.playerId !== info.playerId)
            : [];
          
          await prisma.room.update({
            where: { id: roomId },
            data: {
              players: updatedPlayers,
              lastActivity: new Date(),
            },
          });

          // 重新計算房主（第一個玩家）
          let newHostPlayerId = null;
          if (Array.isArray(updatedPlayers) && updatedPlayers.length > 0) {
            const firstPlayer = updatedPlayers[0];
            if (typeof firstPlayer === "object" && firstPlayer !== null && firstPlayer.playerId) {
              newHostPlayerId = firstPlayer.playerId;
            }
          }

          // 廣播房間更新
          io.to(roomId).emit("room:updated", {
            roomId,
            players: updatedPlayers,
            maxPlayers: room.maxPlayers,
            hostPlayerId: newHostPlayerId,
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
  socket.on("game:start", async (data) => {
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

      const players = room.players || [];
      
      // 檢查房主權限
      let hostPlayerId = null;
      if (Array.isArray(players) && players.length > 0) {
        const firstPlayer = players[0];
        if (typeof firstPlayer === "object" && firstPlayer !== null && firstPlayer.playerId) {
          hostPlayerId = firstPlayer.playerId;
        }
      }
      
      if (hostPlayerId !== info.playerId) {
        socket.emit("error", { message: "只有房主可以開始遊戲" });
        return;
      }

      if (players.length !== 10) {
        socket.emit("error", { message: "需要正好 10 位玩家才能開始遊戲" });
        return;
      }

      // 初始化遊戲
      const playerList = Array.isArray(players)
        ? players.map((p) => ({
            playerId: p.playerId,
            socketId: p.socketId,
            nickname: p.nickname,
          }))
        : [];

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
      console.error(`Failed to start game in room ${roomId}:`, error);
      socket.emit("error", { message: "開始遊戲失敗: " + error.message });
    }
  });

  // 玩家執行遊戲操作
  socket.on("game:action", (data) => {
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

      // 向所有玩家發送更新後的遊戲狀態
      const currentState = gameStates.get(roomId);
      for (const player of currentState.players) {
        const view = getPlayerView(currentState, player.playerId);
        io.to(player.socketId).emit("game:state", view);
      }
    } catch (error) {
      console.error(`Failed to apply action in room ${roomId}:`, error);
      socket.emit("error", { message: "操作失敗: " + error.message });
    }
  });

  socket.on("chat-message", ({ message, roomId }) => {
    const messageData = {
      id: socket.id,
      message,
      timestamp: new Date().toISOString(),
    };
    io.to(roomId).emit("chat-message", messageData);
  });

  socket.on("ready", ({ roomId }) => {
    socket.to(roomId).emit("user-ready", socket.id);
  });

  socket.on("signal", ({ signal, to, from }) => {
    io.to(to).emit("signal", { signal, from });
  });

  socket.on("disconnect", async () => {
    try {
      const info = playerInfo.get(socket.id);
      if (info) {
        const roomId = info.roomId;
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (room) {
          const players = room.players || [];
          const updatedPlayers = Array.isArray(players)
            ? players.filter((p) => typeof p === "object" && p.playerId !== info.playerId)
            : [];
          
          await prisma.room.update({
            where: { id: roomId },
            data: {
              players: updatedPlayers,
              lastActivity: new Date(),
            },
          });

          // 重新計算房主
          const newHostPlayerId = Array.isArray(updatedPlayers) && updatedPlayers.length > 0
            ? (typeof updatedPlayers[0] === "object" ? updatedPlayers[0].playerId : updatedPlayers[0])
            : null;

          // 廣播房間更新
          io.to(roomId).emit("room:updated", {
            roomId,
            players: updatedPlayers,
            maxPlayers: room.maxPlayers,
            hostPlayerId: newHostPlayerId,
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
const HOST = process.env.HOST || '0.0.0.0'; // 監聽所有網路介面

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
