import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ExileTieSpeechPage from "./ExileTieSpeechPage";
import type { PhasePageProps } from "./phase-types";

function makeProps(overrides: Partial<PhasePageProps["state"]> = {}): PhasePageProps {
  return {
    state: {
      phase: "day",
      sub_phase: "exile_tie_speech",
      day_number: 2,
      players: [
        { id: "host-1", nickname: "Alice", alive: true, role: null, seat_index: 0 },
        { id: "p2", nickname: "Bob", alive: true, role: null, seat_index: 1 },
        { id: "p3", nickname: null, alive: false, role: null, seat_index: 2 },
      ],
      sheriff_id: null,
      pending_death: null,
      exile_tie_speech_current_id: "p2",
      ...overrides,
    },
    roomId: "room-1",
    myPlayerId: "host-1",
    onAction: vi.fn(),
  };
}

describe("ExileTieSpeechPage", () => {
  it("renders the header with day number", () => {
    render(<ExileTieSpeechPage {...makeProps()} />);
    expect(screen.getByText(/第 2 天.*平票發言/)).toBeInTheDocument();
  });

  it("shows current speaker name in banner", () => {
    render(<ExileTieSpeechPage {...makeProps()} />);
    expect(screen.getByText(/「Bob」正在發言/)).toBeInTheDocument();
  });

  it("shows fallback banner when no current speaker", () => {
    render(<ExileTieSpeechPage {...makeProps({ exile_tie_speech_current_id: null })} />);
    expect(screen.getByText("等待發言者...")).toBeInTheDocument();
  });

  it("shows advance button for host", () => {
    render(<ExileTieSpeechPage {...makeProps()} />);
    expect(screen.getByText("強制推進")).toBeInTheDocument();
  });

  it("hides advance button for non-host", () => {
    const props = makeProps();
    props.myPlayerId = "p2";
    render(<ExileTieSpeechPage {...props} />);
    expect(screen.queryByText("強制推進")).not.toBeInTheDocument();
  });

  it("calls onAction with advance when host clicks button", () => {
    const onAction = vi.fn();
    const props = makeProps();
    props.onAction = onAction;
    render(<ExileTieSpeechPage {...props} />);
    fireEvent.click(screen.getByText("強制推進"));
    expect(onAction).toHaveBeenCalledWith("advance", {});
  });

  it("only shows alive players", () => {
    render(<ExileTieSpeechPage {...makeProps()} />);
    // p3 is dead and has seat_index 2, should not appear as card
    // alive players: host-1 (seat 01) and p2 (seat 02)
    expect(screen.getAllByText(/^0[12]$/).length).toBe(2);
  });
});
