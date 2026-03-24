import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRoom,
  createGuest,
  getApiOrigin,
  getRoom,
  joinRoom,
  leaveRoom,
  listRooms,
  setApiOriginForTesting,
  setToken,
} from "./client";

vi.mock("next/config", () => ({
  default: vi.fn(),
}));

describe("getApiOrigin", () => {
  afterEach(async () => {
    setApiOriginForTesting(undefined);
    const { default: getConfig } = await import("next/config");
    vi.mocked(getConfig).mockReset();
  });

  it("returns publicRuntimeConfig.apiOrigin when set", async () => {
    const { default: getConfig } = await import("next/config");
    vi.mocked(getConfig).mockReturnValue({
      publicRuntimeConfig: { apiOrigin: "http://localhost:4000" },
    });
    expect(getApiOrigin()).toBe("http://localhost:4000");
  });

  it("returns fallback when publicRuntimeConfig.apiOrigin is empty", async () => {
    const { default: getConfig } = await import("next/config");
    vi.mocked(getConfig).mockReturnValue({
      publicRuntimeConfig: { apiOrigin: "" },
    });
    expect(getApiOrigin()).toBe("https://cluiche-bord.zeabur.app");
  });

  it("uses overridden value when set for testing", async () => {
    const { default: getConfig } = await import("next/config");
    vi.mocked(getConfig).mockReturnValue({
      publicRuntimeConfig: { apiOrigin: "http://env.example.com" },
    });
    setApiOriginForTesting("http://test.example.com");
    expect(getApiOrigin()).toBe("http://test.example.com");
  });
});

describe("createGuest", () => {
  beforeEach(() => {
    setApiOriginForTesting("http://api.test");
    setToken(null);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POSTs to /api/auth/guest and returns token, user_id, nickname", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        token: "bearer-token-123",
        user_id: "user-uuid-1",
        nickname: "Player1",
      }),
    });

    const result = await createGuest();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/auth/guest",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    );
    expect(result).toEqual({
      token: "bearer-token-123",
      user_id: "user-uuid-1",
      nickname: "Player1",
    });
  });

  it("sends device_id when provided", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ token: "t", user_id: "u", nickname: null }),
    });

    await createGuest("device-uuid-456");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/auth/guest",
      expect.objectContaining({
        body: JSON.stringify({ device_id: "device-uuid-456" }),
      })
    );
  });

  it("sends nickname when provided", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ token: "t", user_id: "u", nickname: "MyName" }),
    });

    await createGuest(undefined, "MyName");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/auth/guest",
      expect.objectContaining({
        body: JSON.stringify({ nickname: "MyName" }),
      })
    );
  });

  it("stores token after successful createGuest", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        token: "stored-token",
        user_id: "uid",
        nickname: "Guest",
      }),
    });

    await createGuest();
    const { getToken } = await import("./client");
    expect(getToken()).toBe("stored-token");
  });
});

describe("room API", () => {
  beforeEach(() => {
    setApiOriginForTesting("http://api.test");
    setToken("auth-token");
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("createRoom POSTs to /api/rooms with Bearer and body", async () => {
    const room = {
      id: "ABC123",
      name: "New Room",
      max_players: 10,
      game_id: "game-uuid",
      variant_id: null,
      host_user_id: "host-uuid",
      players: [],
      game_status: "waiting" as const,
      created_at: "2025-01-01T00:00:00Z",
      last_activity: "2025-01-01T00:00:00Z",
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => room,
    });

    const result = await createRoom({ name: "New Room", max_players: 10 });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rooms",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer auth-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ name: "New Room", max_players: 10 }),
      })
    );
    expect(result).toEqual(room);
  });

  it("listRooms GETs /api/rooms with optional query params", async () => {
    const rooms = [
      {
        id: "R1",
        name: "Room 1",
        current_players: 2,
        max_players: 10,
        game_status: "waiting" as const,
        created_at: "2025-01-01T00:00:00Z",
      },
    ];
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rooms }),
    });

    const result = await listRooms({ game_id: "game-uuid", limit: 5 });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rooms?game_id=game-uuid&limit=5",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer auth-token" }),
      })
    );
    expect(result.rooms).toEqual(rooms);
  });

  it("getRoom GETs /api/rooms/{id}", async () => {
    const room = {
      id: "WT0TDF",
      name: "Test",
      max_players: 10,
      game_id: "game-uuid",
      variant_id: null,
      host_user_id: "host-uuid",
      players: [],
      game_status: "waiting" as const,
      created_at: "2025-01-01T00:00:00Z",
      last_activity: "2025-01-01T00:00:00Z",
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => room,
    });

    const result = await getRoom("WT0TDF");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rooms/WT0TDF",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(room);
  });

  it("joinRoom POSTs to /api/rooms/{id}/join with optional nickname", async () => {
    const room = {
      id: "WT0TDF",
      name: "Test",
      max_players: 10,
      game_id: "game-uuid",
      variant_id: null,
      host_user_id: "host-uuid",
      players: [{ user_id: "me", nickname: "MyNick" }],
      game_status: "waiting" as const,
      created_at: "2025-01-01T00:00:00Z",
      last_activity: "2025-01-01T00:00:00Z",
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, room }),
    });

    const result = await joinRoom("WT0TDF", { nickname: "MyNick" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rooms/WT0TDF/join",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer auth-token" }),
        body: JSON.stringify({ nickname: "MyNick" }),
      })
    );
    expect(result.success).toBe(true);
    expect(result.room).toEqual(room);
  });

  it("leaveRoom POSTs to /api/rooms/{id}/leave", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => undefined,
    });

    await leaveRoom("WT0TDF");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rooms/WT0TDF/leave",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer auth-token" }),
      })
    );
  });
});
