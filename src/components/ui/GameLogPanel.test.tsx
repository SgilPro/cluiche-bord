import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GameLogPanel from "./GameLogPanel";
import type { PublicLogEntry } from "@/lib/games/werewolf/types";

const makeEntry = (seq: number, narration: string | null = null): PublicLogEntry => ({
  seq,
  type: "test_event",
  phase: "night",
  day: 1,
  visibility: "public",
  visible_to: "all",
  narration,
  data: {},
  at: "2026-03-26T00:00:00Z",
});

describe("GameLogPanel", () => {
  it("shows 尚無記錄 when entries is empty", () => {
    render(<GameLogPanel entries={[]} onClose={vi.fn()} />);
    expect(screen.getByText("尚無記錄")).toBeInTheDocument();
  });

  it("renders narration text for entries", () => {
    const entries = [makeEntry(1, "狼人選擇了目標")];
    render(<GameLogPanel entries={entries} onClose={vi.fn()} />);
    expect(screen.getByText("狼人選擇了目標")).toBeInTheDocument();
  });

  it("calls onClose when X button is clicked", () => {
    const onClose = vi.fn();
    render(<GameLogPanel entries={[]} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "關閉" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays entries in reverse order (latest first)", () => {
    const entries = [
      makeEntry(1, "第一條旁白"),
      makeEntry(2, "第二條旁白"),
      makeEntry(3, "第三條旁白"),
    ];
    render(<GameLogPanel entries={entries} onClose={vi.fn()} />);
    const items = screen.getAllByText(/條旁白/);
    // Latest (seq 3) should appear before earliest (seq 1)
    expect(items[0].textContent).toBe("第三條旁白");
    expect(items[2].textContent).toBe("第一條旁白");
  });
});
