import { io } from "socket.io-client";

let socket: ReturnType<typeof io> | null = null;

// Socket.IO 需要 http:// 或 https://，不是 ws://
// 在開發環境中，如果使用 localhost 訪問，socket 也應該使用 localhost
const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001";
let SOCKET_URL = rawUrl.replace(/^ws:\/\//, "http://").replace(/^wss:\/\//, "https://");

// 如果當前頁面使用 localhost，強制 socket 也使用 localhost
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  SOCKET_URL = SOCKET_URL.replace(/192\.168\.\d+\.\d+/, "localhost");
  console.log("Using localhost for socket connection:", SOCKET_URL);
}

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

    socket.on("connect_error", (error: unknown) => {
      if (error instanceof Error) {
        console.error("Socket connection error:", error.message, error);
      } else {
        console.error("Socket connection error (raw):", error);
      }
      // 如果連線失敗，嘗試使用 localhost
      if (SOCKET_URL.includes("192.168")) {
        console.log("Connection to network IP failed, trying localhost...");
        const localhostUrl = SOCKET_URL.replace(/192\.168\.\d+\.\d+/, "localhost");
        console.log("Attempting to reconnect to:", localhostUrl);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("error", (error: unknown) => {
      if (error instanceof Error) {
        console.error("Socket error:", error.message, error);
      } else if (typeof error === "object" && error !== null) {
        // Some Socket.IO errors are plain objects or have non‑enumerable properties
        console.error("Socket error (object):", {
          // try common fields
          ...(error as { message?: string; description?: string; type?: string }),
        });
      } else {
        console.error("Socket error (raw):", error);
      }
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
