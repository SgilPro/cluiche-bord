const { Server } = require("socket.io");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOMS_FILE = path.join(process.cwd(), "data", "rooms.json");

// 確保 data 目錄存在
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"));
}
if (!fs.existsSync(ROOMS_FILE)) {
  fs.writeFileSync(ROOMS_FILE, JSON.stringify([]));
}

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

function readRooms() {
  try {
    const data = fs.readFileSync(ROOMS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read rooms:", error);
    return [];
  }
}

function writeRooms(rooms) {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
  } catch (error) {
    console.error("Failed to write rooms:", error);
  }
}

function updateRoomPlayers(roomId, playerId, isJoining) {
  const rooms = readRooms();
  const roomIndex = rooms.findIndex((room) => room.id === roomId);
  if (roomIndex !== -1) {
    if (isJoining) {
      if (!rooms[roomIndex].players.includes(playerId)) {
        rooms[roomIndex].players.push(playerId);
      }
    } else {
      rooms[roomIndex].players = rooms[roomIndex].players.filter(
        (id) => id !== playerId
      );
    }
    rooms[roomIndex].lastActivity = new Date().toISOString();
    writeRooms(rooms);
  }
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.emit("connection-confirmed", { id: socket.id });

  socket.on("join-room", (roomId) => {
    console.log(`Client ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
    updateRoomPlayers(roomId, socket.id, true);
    io.emit("user-joined", roomId);
  });

  socket.on("leave-room", (roomId) => {
    console.log(`Client ${socket.id} leaving room ${roomId}`);
    socket.leave(roomId);
    updateRoomPlayers(roomId, socket.id, false);
    io.emit("user-left", roomId);
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

  socket.on("disconnect", () => {
    const rooms = readRooms();
    rooms.forEach((room) => {
      if (room.players.includes(socket.id)) {
        updateRoomPlayers(room.id, socket.id, false);
        io.emit("user-left", room.id);
      }
    });
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(4001, () => {
  console.log("Socket.IO server running on port 4001");
}); 