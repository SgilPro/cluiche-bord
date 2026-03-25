import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WerewolfChannelApi } from "@/lib/channel";

// ---------- hoisted mock values ----------

const {
  mockPush,
  mockConnect,
  mockJoin,
  mockOn,
  mockDisconnect,
  mockGetRoom,
  HOST_USER_ID,
} = vi.hoisted(() => ({
  mockPush: vi.fn().mockResolvedValue({ status: "ok" }),
  mockConnect: vi.fn().mockResolvedValue(undefined),
  mockJoin: vi.fn().mockResolvedValue(undefined),
  mockOn: vi.fn().mockReturnValue(1),
  mockDisconnect: vi.fn(),
  mockGetRoom: vi.fn(),
  HOST_USER_ID: "user-host-123",
}));

// ---------- module mocks ----------

vi.mock("@/lib/channel", () => {
  const mockChannelApi: WerewolfChannelApi = {
    connect: mockConnect,
    join: mockJoin,
    push: mockPush,
    on: mockOn,
    off: vi.fn(),
    leave: vi.fn(),
    disconnect: mockDisconnect,
  };
  return {
    createWerewolfChannel: vi.fn(() => mockChannelApi),
  };
});

vi.mock("@/lib/api", () => ({
  getRoom: mockGetRoom,
  getToken: vi.fn().mockReturnValue("mock-token"),
  getUserId: vi.fn().mockReturnValue(HOST_USER_ID),
  getApiOrigin: vi.fn().mockReturnValue("http://localhost:4000"),
  leaveRoom: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  useParams: vi.fn().mockReturnValue({ roomId: "abc123" }),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

// ---------- page component (imported after mocks) ----------

import WaitingRoomPage from "./page";
import type { Room } from "@/lib/api";

// ---------- test data ----------

const mockRoom: Room = {
  id: "abc123",
  name: "Test Room",
  max_players: 2,
  game_id: "werewolf",
  variant_id: null,
  host_user_id: HOST_USER_ID,
  players: [
    { user_id: HOST_USER_ID, nickname: "Host" },
    { user_id: "user-other-456", nickname: "Player2" },
  ],
  game_status: "waiting",
  created_at: "2026-01-01T00:00:00Z",
  last_activity: "2026-01-01T00:00:00Z",
};

// ---------- tests ----------

describe("WaitingRoomPage – handleStartGame", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockConnect.mockClear();
    mockJoin.mockClear();
    mockOn.mockClear();
    mockConnect.mockResolvedValue(undefined);
    mockJoin.mockResolvedValue(undefined);
    mockPush.mockResolvedValue({ status: "ok" });
    mockOn.mockReturnValue(1);
    mockGetRoom.mockResolvedValue(mockRoom);
  });

  it("start_game push payload contains only player_ids, no config", async () => {
    render(<WaitingRoomPage />);

    // Wait for the room to load and the host button to appear
    const startButton = await screen.findByRole("button", { name: /開始遊戲/ });
    expect(startButton).toBeInTheDocument();

    // Allow channel connect/join to settle
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });

    const [event, payload] = mockPush.mock.calls[0] as [string, Record<string, unknown>];
    expect(event).toBe("start_game");

    // Must have player_ids
    expect(payload).toHaveProperty("player_ids");
    expect(payload.player_ids).toEqual([HOST_USER_ID, "user-other-456"]);

    // Must NOT have config
    expect(payload).not.toHaveProperty("config");
  });
});
