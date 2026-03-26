import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NightOpeningScreen from "./NightOpeningScreen";

describe("NightOpeningScreen", () => {
  it("renders the night closing eyes prompt", () => {
    render(<NightOpeningScreen dayNumber={1} />);
    expect(screen.getByText("請所有玩家閉上雙眼")).toBeInTheDocument();
  });

  it("renders the day number", () => {
    render(<NightOpeningScreen dayNumber={3} />);
    expect(screen.getByText("Day 3")).toBeInTheDocument();
  });

  it("shows PhaseTimer when timerEndsAt is provided", () => {
    const timerEndsAt = Math.floor(Date.now() / 1000) + 60;
    render(<NightOpeningScreen dayNumber={1} timerEndsAt={timerEndsAt} />);
    expect(screen.getByText(/^\d+$/)).toBeInTheDocument();
  });

  it("does not show PhaseTimer when timerEndsAt is not provided", () => {
    render(<NightOpeningScreen dayNumber={1} />);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows advance button when isHost=true and onAdvance provided", () => {
    const onAdvance = vi.fn();
    render(<NightOpeningScreen dayNumber={1} isHost={true} onAdvance={onAdvance} />);
    expect(screen.getByText("推進")).toBeInTheDocument();
  });

  it("does not show advance button when isHost=false", () => {
    const onAdvance = vi.fn();
    render(<NightOpeningScreen dayNumber={1} isHost={false} onAdvance={onAdvance} />);
    expect(screen.queryByText("推進")).not.toBeInTheDocument();
  });

  it("calls onAdvance when advance button is clicked", () => {
    const onAdvance = vi.fn();
    render(<NightOpeningScreen dayNumber={1} isHost={true} onAdvance={onAdvance} />);
    fireEvent.click(screen.getByText("推進"));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
