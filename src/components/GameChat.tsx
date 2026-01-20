"use client";

import { disconnectSocket, getSocket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";

interface Message {
  id: string;
  message: string;
  timestamp: string;
  username?: string;
}

interface GameChatProps {
  roomId: string;
}

export default function GameChat({ roomId }: GameChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const peersRef = useRef<{ [key: string]: Peer.Instance }>({});
  const streamRef = useRef<MediaStream | null>(null);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("Initializing socket connection...");
      socketRef.current = getSocket();

      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("Connected to socket server");
        setIsConnected(true);

        if (!hasJoinedRoom.current) {
          console.log("Joining room:", roomId);
          socket.emit("join-room", roomId);
          hasJoinedRoom.current = true;
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      socket.on("disconnect", (reason) => {
        console.log("Disconnected from socket server:", reason);
        setIsConnected(false);
        hasJoinedRoom.current = false;
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log(
          "Reconnected to socket server after",
          attemptNumber,
          "attempts"
        );
        setIsConnected(true);

        if (!hasJoinedRoom.current) {
          console.log("Rejoining room:", roomId);
          socket.emit("join-room", roomId);
          hasJoinedRoom.current = true;
        }
      });

      socket.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
      });

      socket.on("reconnect_failed", () => {
        console.error("Socket reconnection failed");
      });

      socket.on("chat-message", (message: Message) => {
        console.log("Received message:", message);
        setMessages((prev) => [...prev, message]);
      });

      socket.on("signal", async ({ signal, from }) => {
        const peer = peersRef.current[from];
        if (peer) {
          peer.signal(signal);
        }
      });

      // 如果已經連接，立即加入房間
      if (socket.connected && !hasJoinedRoom.current) {
        console.log("Socket already connected, joining room:", roomId);
        socket.emit("join-room", roomId);
        hasJoinedRoom.current = true;
      }

      return () => {
        console.log("Cleaning up socket connection...");
        if (hasJoinedRoom.current) {
          console.log("Leaving room:", roomId);
          socket.emit("leave-room", roomId);
          hasJoinedRoom.current = false;
        }
        disconnectSocket();
      };
    }
  }, [roomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      console.log("Sending message:", { message: newMessage, roomId });
      socketRef.current.emit("chat-message", {
        message: newMessage,
        roomId,
      });
      setNewMessage("");
    }
  };

  const toggleVoiceChat = async () => {
    if (!isVoiceEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        setIsVoiceEnabled(true);

        socketRef.current?.emit("ready", { roomId });
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    } else {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsVoiceEnabled(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">遊戲聊天室</h2>
        <div className="text-sm text-gray-500">
          {isConnected ? (
            <span className="text-green-500">已連接</span>
          ) : (
            <span className="text-yellow-500">連接中...</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className="p-2 rounded bg-white shadow-sm">
            <div className="text-sm text-gray-500">
              {msg.username || msg.id}
            </div>
            <div>{msg.message}</div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2 mb-2">
          <button
            onClick={toggleVoiceChat}
            className={`px-4 py-2 rounded ${
              isVoiceEnabled
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            {isVoiceEnabled ? "關閉語音" : "開啟語音"}
          </button>
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
            placeholder="輸入訊息..."
            disabled={!isConnected}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded text-white ${
              isConnected
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!isConnected}
          >
            發送
          </button>
        </form>
      </div>
    </div>
  );
}
