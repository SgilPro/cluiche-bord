import "@testing-library/jest-dom";

/**
 * Vitest setup: mock WebSocket for Phoenix channel tests.
 * Phoenix Socket accepts opts.transport; we inject this mock in tests.
 */
export class MockWebSocket {
  url: string;
  readyState: number;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    queueMicrotask(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.();
      }
    });
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(_code?: number, _reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    queueMicrotask(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.({ code: _code ?? 1000, reason: _reason ?? "" });
    });
  }

  /** Simulate server sending a Phoenix-format message. */
  simulateMessage(joinRef: string, ref: string, topic: string, event: string, payload: unknown): void {
    const data = JSON.stringify([joinRef, ref, topic, event, payload]);
    this.onmessage?.({ data });
  }
}
