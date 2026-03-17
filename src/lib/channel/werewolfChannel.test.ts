import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockWebSocket } from "@/test/setup";
import { createWerewolfChannel } from "./werewolfChannel";

/** Phoenix Socket uses `new transport(url)`; we need a constructor that returns a MockWebSocket and exposes it. */
let lastMockInstance: MockWebSocket | null = null;
class MockTransport {
  constructor(url: string) {
    lastMockInstance = new MockWebSocket(url);
    return lastMockInstance;
  }
}

describe("werewolfChannel", () => {
  const defaultUrl = "ws://localhost:4000/socket";
  const token = "test-token-123";

  beforeEach(() => {
    lastMockInstance = null;
  });

  /** After connect+join, deliver phx_reply so join resolves. Uses ref from last phx_join in sent. */
  function deliverJoinOk(mockWs: MockWebSocket, topic: string): void {
    const joinMessage = mockWs.sent.find((s) => {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) && parsed[3] === "phx_join";
    });
    if (!joinMessage) return;
    const [joinRef, ref] = JSON.parse(joinMessage);
    mockWs.simulateMessage(joinRef, ref, topic, "phx_reply", {
      response: { status: "ok" },
      status: "ok",
    });
  }

  describe("connect", () => {
    it("connects with token and vsn in query when transport is provided", async () => {
      const channel = createWerewolfChannel({
        url: defaultUrl,
        token,
        transport: MockTransport as unknown as typeof WebSocket,
      });
      await channel.connect();
      expect(lastMockInstance).toBeTruthy();
      const calledUrl = lastMockInstance!.url;
      expect(calledUrl).toContain("token=test-token-123");
      expect(calledUrl).toContain("vsn=2.0.0");
      expect(calledUrl).toContain("/websocket");
      channel.disconnect();
    });
  });

  describe("join", () => {
    it("joins topic werewolf:room:mock", async () => {
      const channel = createWerewolfChannel({
        url: defaultUrl,
        token,
        transport: MockTransport as unknown as typeof WebSocket,
      });
      await channel.connect();
      const joinPromise = channel.join("mock");
      const mockWs = lastMockInstance!;
      const joinMessage = mockWs.sent.find((s) => {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) && parsed[3] === "phx_join";
      });
      expect(joinMessage).toBeDefined();
      const [, , topic] = JSON.parse(joinMessage!);
      expect(topic).toBe("werewolf:room:mock");
      deliverJoinOk(mockWs, "werewolf:room:mock");
      await expect(joinPromise).resolves.toBeUndefined();
      channel.disconnect();
    });

    it("joins topic werewolf:room:{roomId} for real room", async () => {
      const channel = createWerewolfChannel({
        url: defaultUrl,
        token,
        transport: MockTransport as unknown as typeof WebSocket,
      });
      await channel.connect();
      const joinPromise = channel.join("room-abc");
      const mockWs = lastMockInstance!;
      const joinMessage = mockWs.sent.find((s) => {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) && parsed[3] === "phx_join";
      });
      expect(joinMessage).toBeDefined();
      const [, , topic] = JSON.parse(joinMessage!);
      expect(topic).toBe("werewolf:room:room-abc");
      deliverJoinOk(mockWs, "werewolf:room:room-abc");
      await joinPromise;
      channel.disconnect();
    });
  });

  describe("push", () => {
    it("push start_game sends correct event and payload", async () => {
      const channel = createWerewolfChannel({
        url: defaultUrl,
        token,
        transport: MockTransport as unknown as typeof WebSocket,
      });
      await channel.connect();
      const joinPromise = channel.join("mock");
      const mockWs = lastMockInstance!;
      deliverJoinOk(mockWs, "werewolf:room:mock");
      await joinPromise;

      const payload = { config: { rules: {} }, player_ids: ["p1", "p2"] };
      const pushPromise = channel.push("start_game", payload);
      const pushMessage = mockWs.sent.find((s) => {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) && parsed[3] === "start_game";
      });
      expect(pushMessage).toBeDefined();
      const parsed = JSON.parse(pushMessage!);
      const ref = parsed[1];
      const pushPayload = parsed[4];
      expect(pushPayload).toEqual(payload);
      mockWs.simulateMessage(parsed[0], ref, "werewolf:room:mock", "phx_reply", {
        response: { game_id: "g1", state: {} },
        status: "ok",
      });
      const result = await pushPromise;
      expect(result.status).toBe("ok");
      expect((result as { response?: { game_id?: string } }).response?.game_id).toBe("g1");
      channel.disconnect();
    });
  });

  describe("listen", () => {
    it("receives state event and calls callback", async () => {
      const channel = createWerewolfChannel({
        url: defaultUrl,
        token,
        transport: MockTransport as unknown as typeof WebSocket,
      });
      await channel.connect();
      const joinPromise = channel.join("mock");
      const mockWs = lastMockInstance!;
      deliverJoinOk(mockWs, "werewolf:room:mock");
      await joinPromise;

      const joinMessage = mockWs.sent.find((s) => {
        const p = JSON.parse(s);
        return Array.isArray(p) && p[3] === "phx_join";
      });
      const [, channelJoinRef] = joinMessage ? JSON.parse(joinMessage) : ["1", "1"];
      const statePayload = {
        phase: "night",
        sub_phase: "wolves",
        day_number: 1,
        players: [],
        sheriff_id: null,
        pending_death: null,
      };
      const onState = vi.fn();
      channel.on("state", onState);
      mockWs.simulateMessage(channelJoinRef, "", "werewolf:room:mock", "state", statePayload);
      expect(onState).toHaveBeenCalledTimes(1);
      expect(onState.mock.calls[0][0]).toEqual(statePayload);
      channel.disconnect();
    });
  });
});
