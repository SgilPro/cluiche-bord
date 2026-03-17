import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SegmentedControl from "./SegmentedControl";

const segments = [
  { id: "reorder", label: "重新排序" },
  { id: "change-host", label: "變更房主" },
];

describe("SegmentedControl", () => {
  it("renders all segment labels", () => {
    render(<SegmentedControl segments={segments} activeId="reorder" />);
    expect(screen.getByRole("tab", { name: "重新排序" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "變更房主" })).toBeInTheDocument();
  });

  it("marks active segment with active state", () => {
    render(<SegmentedControl segments={segments} activeId="change-host" />);
    const activeBtn = screen.getByRole("tab", { name: "變更房主" });
    const inactiveBtn = screen.getByRole("tab", { name: "重新排序" });
    expect(activeBtn).toHaveAttribute("data-active", "true");
    expect(inactiveBtn).toHaveAttribute("data-active", "false");
  });

  it("calls onSelect with segment id when segment is clicked", () => {
    const onSelect = vi.fn();
    render(
      <SegmentedControl
        segments={segments}
        activeId="reorder"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByRole("tab", { name: "變更房主" }));
    expect(onSelect).toHaveBeenCalledWith("change-host");
  });
});
