import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NarrationBar from "./NarrationBar";

describe("NarrationBar", () => {
  it("renders narration text when narration is provided", () => {
    render(<NarrationBar narration="第一夜降臨，狼人開始行動" onOpenLog={vi.fn()} />);
    expect(screen.getByText("第一夜降臨，狼人開始行動")).toBeInTheDocument();
  });

  it("renders nothing when narration is null", () => {
    const { container } = render(
      <NarrationBar narration={null} onOpenLog={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("calls onOpenLog when BookOpen button is clicked", () => {
    const onOpenLog = vi.fn();
    render(<NarrationBar narration="旁白文字" onOpenLog={onOpenLog} />);
    fireEvent.click(screen.getByRole("button", { name: "查看遊戲記錄" }));
    expect(onOpenLog).toHaveBeenCalledTimes(1);
  });
});
