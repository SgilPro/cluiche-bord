declare module "phoenix" {
  export class Socket {
    constructor(endPoint: string, opts?: { params?: Record<string, string>; vsn?: string; transport?: typeof WebSocket });
    connect(params?: Record<string, unknown>): void;
    disconnect(callback?: () => void, code?: number, reason?: string): void;
    onOpen(callback: () => void): number;
    onClose(callback: () => void): number;
    onError(callback: (error: unknown) => void): number;
    channel(topic: string, params?: Record<string, unknown>): Channel;
    remove(channel: Channel): void;
    push(data: { topic: string; event: string; payload: unknown; ref: string; join_ref: string }): void;
    makeRef(): string;
    isConnected(): boolean;
  }

  export class Channel {
    constructor(topic: string, params: Record<string, unknown>, socket: Socket);
    join(timeout?: number): Push;
    on(event: string, callback: (payload: unknown, ref?: string, joinRef?: string) => unknown): number;
    off(event: string, ref?: number): void;
    push(event: string, payload?: unknown, timeout?: number): Push;
    leave(timeout?: number): Push;
    trigger(event: string, payload: unknown, ref?: string, joinRef?: string): void;
  }

  export class Push {
    receive(status: string, callback: (response: unknown) => void): this;
    send(): void;
  }
}
