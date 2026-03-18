import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "./Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <Card className="custom-panel">Content</Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-panel");
  });

  it("default variant renders with shadow-sm class", () => {
    const { container } = render(<Card variant="default">Default</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("shadow-sm");
  });

  it("ticket variant renders with border-dashed class", () => {
    const { container } = render(<Card variant="ticket">Ticket</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("border-dashed");
  });

  it("surface variant renders with border class", () => {
    const { container } = render(<Card variant="surface">Surface</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("border");
  });
});
