import { io } from "socket.io-client";

let socket: ReturnType<typeof io> | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:4001";

export const getSocket = () => {
  if (!socket) {
    console.log("Initializing Socket.IO client...", SOCKET_URL);

    socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true,
    });

    // 添加連接狀態的日誌
    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("connection-confirmed", (data) => {
      console.log("Connection confirmed by server:", data);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
};
