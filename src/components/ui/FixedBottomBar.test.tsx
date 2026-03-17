import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Button from "./Button";
import FixedBottomBar from "./FixedBottomBar";

describe("FixedBottomBar", () => {
  it("renders children", () => {
    render(
      <FixedBottomBar>
        <Button variant="danger">Leave</Button>
        <Button variant="success">Start</Button>
      </FixedBottomBar>
    );
    expect(screen.getByRole("button", { name: "Leave" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });

  it("has fixed position at bottom", () => {
    const { container } = render(
      <FixedBottomBar>
        <button type="button">Left</button>
        <button type="button">Right</button>
      </FixedBottomBar>
    );
    const bar = container.firstChild as HTMLElement;
    expect(bar).toHaveClass("fixed", "bottom-0");
  });

  it("lays out two buttons side by side with equal width", () => {
    const { container } = render(
      <FixedBottomBar>
        <button type="button">Left</button>
        <button type="button">Right</button>
      </FixedBottomBar>
    );
    const bar = container.firstChild as HTMLElement;
    expect(bar).toHaveClass("flex");
    const buttons = bar.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
  });
});
