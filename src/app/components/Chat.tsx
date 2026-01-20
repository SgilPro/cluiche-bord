"use client";

import { getSocket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { Socket } from "socket.io-client";

interface Message {
  id: string;
  message: string;
  timestamp: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<{ [key: string]: Peer.Instance }>({});
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      socketRef.current = getSocket();

      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("Connected to socket server");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("chat-message", (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on("signal", async ({ signal, from }) => {
        const peer = peersRef.current[from];
        if (peer) {
          peer.signal(signal);
        }
      });

      // 只移除事件監聽，不 disconnect
      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("chat-message");
        socket.off("signal");
      };
    }
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit("chat-message", newMessage);
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

        // Create peer connection for each existing user
        socketRef.current?.emit("ready");
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    } else {
      // Stop all peer connections
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};

      // Stop local stream
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsVoiceEnabled(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className="p-2 rounded bg-white shadow-sm">
            <div className="text-sm text-gray-500">{msg.id}</div>
            <div>{msg.message}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
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

        <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
            placeholder="輸入訊息..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            發送
          </button>
        </form>
      </div>
    </div>
  );
}
