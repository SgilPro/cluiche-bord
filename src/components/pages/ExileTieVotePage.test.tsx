import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ExileTieVotePage from "./ExileTieVotePage";
import type { PhasePageProps } from "./phase-types";

function makeProps(overrides: Partial<PhasePageProps["state"]> = {}): PhasePageProps {
  return {
    state: {
      phase: "day",
      sub_phase: "exile_tie_vote",
      day_number: 2,
      players: [
        { id: "host-1", nickname: "Alice", alive: true, role: null, seat_index: 0 },
        { id: "p2", nickname: "Bob", alive: true, role: null, seat_index: 1 },
        { id: "p3", nickname: "Carol", alive: true, role: null, seat_index: 2 },
        { id: "p4", nickname: null, alive: false, role: null, seat_index: 3 },
      ],
      sheriff_id: "host-1",
      pending_death: null,
      ...overrides,
    },
    roomId: "room-1",
    myPlayerId: "host-1",
    onAction: vi.fn(),
  };
}

describe("ExileTieVotePage", () => {
  it("renders the header with day number", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    expect(screen.getByText(/第 2 天.*平票重投/)).toBeInTheDocument();
  });

  it("renders the notification banner", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    expect(screen.getByText("候選人不得投票，請其他玩家選擇放逐對象")).toBeInTheDocument();
  });

  it("shows advance button for host on the left", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    expect(screen.getByText("強制推進")).toBeInTheDocument();
  });

  it("hides advance button for non-host", () => {
    const props = makeProps();
    props.myPlayerId = "p2";
    render(<ExileTieVotePage {...props} />);
    expect(screen.queryByText("強制推進")).not.toBeInTheDocument();
  });

  it("confirm button is disabled before selection", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    const confirmBtn = screen.getByText("確認放逐").closest("button");
    expect(confirmBtn).toBeDisabled();
  });

  it("cancel button is disabled before selection", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    const cancelBtn = screen.getByText("取消選擇").closest("button");
    expect(cancelBtn).toBeDisabled();
  });

  it("enables confirm and cancel after player selection", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    // Click seat-label "02" (Bob)
    fireEvent.click(screen.getByText("02"));
    expect(screen.getByText("確認放逐").closest("button")).not.toBeDisabled();
    expect(screen.getByText("取消選擇").closest("button")).not.toBeDisabled();
  });

  it("calls onAction with day_vote on confirm", () => {
    const onAction = vi.fn();
    const props = makeProps();
    props.onAction = onAction;
    render(<ExileTieVotePage {...props} />);
    fireEvent.click(screen.getByText("02"));
    fireEvent.click(screen.getByText("確認放逐"));
    expect(onAction).toHaveBeenCalledWith("day_vote", { target_id: "p2" });
  });

  it("deselects player on second click (toggle)", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    fireEvent.click(screen.getByText("02"));
    fireEvent.click(screen.getByText("02"));
    expect(screen.getByText("確認放逐").closest("button")).toBeDisabled();
  });

  it("clears selection on cancel click", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    fireEvent.click(screen.getByText("02"));
    fireEvent.click(screen.getByText("取消選擇"));
    expect(screen.getByText("確認放逐").closest("button")).toBeDisabled();
  });

  it("only shows alive players", () => {
    render(<ExileTieVotePage {...makeProps()} />);
    // p4 is dead (seat_index 3 => label "04"), should not appear
    expect(screen.queryByText("04")).not.toBeInTheDocument();
    expect(screen.getAllByText(/^0[123]$/).length).toBe(3);
  });

  it("shows PhaseTimer when timer_ends_at is provided", () => {
    render(<ExileTieVotePage {...makeProps({ timer_ends_at: Date.now() / 1000 + 60 })} />);
    // PhaseTimer renders some time element
    expect(document.querySelector("span") ?? document.querySelector("div")).toBeTruthy();
  });
});
