import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RoleRevealScreen from "./RoleRevealScreen";

describe("RoleRevealScreen", () => {
  it("renders the role name", () => {
    render(<RoleRevealScreen role="villager" />);
    expect(screen.getByText("村民")).toBeInTheDocument();
  });

  it("shows PhaseTimer when timerEndsAt is provided", () => {
    const timerEndsAt = Math.floor(Date.now() / 1000) + 60;
    render(<RoleRevealScreen role="wolf" timerEndsAt={timerEndsAt} />);
    // PhaseTimer renders a span with tabular-nums; it should show a number
    expect(screen.getByText(/^\d+$/)).toBeInTheDocument();
  });

  it("does not show PhaseTimer when timerEndsAt is not provided", () => {
    render(<RoleRevealScreen role="villager" />);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows advance button when isHost=true and onAdvance provided", () => {
    const onAdvance = vi.fn();
    render(<RoleRevealScreen role="seer" isHost={true} onAdvance={onAdvance} />);
    expect(screen.getByText("推進")).toBeInTheDocument();
  });

  it("does not show advance button when isHost=false", () => {
    const onAdvance = vi.fn();
    render(<RoleRevealScreen role="seer" isHost={false} onAdvance={onAdvance} />);
    expect(screen.queryByText("推進")).not.toBeInTheDocument();
  });

  it("does not show advance button when onAdvance is not provided", () => {
    render(<RoleRevealScreen role="seer" isHost={true} />);
    expect(screen.queryByText("推進")).not.toBeInTheDocument();
  });

  it("calls onAdvance when advance button is clicked", () => {
    const onAdvance = vi.fn();
    render(<RoleRevealScreen role="wolf" isHost={true} onAdvance={onAdvance} />);
    fireEvent.click(screen.getByText("推進"));
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });
});
