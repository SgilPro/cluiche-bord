import { Socket, Channel } from "phoenix";
import type { WerewolfPushEvent, WerewolfChannelEvent } from "./types";

const VSN = "2.0.0";

export interface WerewolfChannelConfig {
  /** WebSocket base URL, e.g. ws://localhost:4000/socket (Socket appends /websocket and params) */
  url: string;
  /** Phoenix.Token for auth; sent as `token` query param */
  token: string;
  /** Optional transport (e.g. mock WebSocket for tests) */
  transport?: typeof WebSocket;
}

export interface PushReply {
  status: "ok" | "error";
  response?: unknown;
}

export interface WerewolfChannelApi {
  connect(): Promise<void>;
  join(roomId: string): Promise<void>;
  push(event: WerewolfPushEvent, payload?: Record<string, unknown>): Promise<PushReply>;
  on(event: WerewolfChannelEvent, callback: (payload: unknown) => void): number;
  off(event: WerewolfChannelEvent, ref?: number): void;
  leave(): void;
  disconnect(): void;
}

export function createWerewolfChannel(config: WerewolfChannelConfig): WerewolfChannelApi {
  const { url, token, transport } = config;
  const socket = new Socket(url, {
    params: { token },
    vsn: VSN,
    transport: transport ?? undefined,
  });

  let channel: Channel | null = null;

  function topicFor(roomId: string): string {
    return roomId === "mock" ? "werewolf:room:mock" : `werewolf:room:${roomId}`;
  }

  return {
    connect(): Promise<void> {
      return new Promise((resolve, reject) => {
        socket.onOpen(resolve);
        socket.onError(reject);
        socket.connect();
      });
    },

    join(roomId: string): Promise<void> {
      const topic = topicFor(roomId);
      channel = socket.channel(topic, {});
      return new Promise((resolve, reject) => {
        channel!
          .join()
          .receive("ok", () => resolve())
          .receive("error", (err: unknown) => reject(err))
          .receive("timeout", () => reject(new Error("join timeout")));
      });
    },

    push(event: WerewolfPushEvent, payload: Record<string, unknown> = {}): Promise<PushReply> {
      if (!channel) return Promise.reject(new Error("Not joined. Call join() first."));
      return new Promise((resolve, reject) => {
        channel!
          .push(event, payload)
          .receive("ok", (response: unknown) => resolve({ status: "ok", response }))
          .receive("error", (response: unknown) => resolve({ status: "error", response }))
          .receive("timeout", () => reject(new Error(`push ${event} timeout`)));
      });
    },

    on(event: WerewolfChannelEvent, callback: (payload: unknown) => void): number {
      if (!channel) throw new Error("Not joined. Call join() first.");
      return channel.on(event, callback);
    },

    off(event: WerewolfChannelEvent, ref?: number): void {
      channel?.off(event, ref);
    },

    leave(): void {
      channel?.leave();
      channel = null;
    },

    disconnect(): void {
      channel?.leave();
      channel = null;
      socket.disconnect();
    },
  };
}
