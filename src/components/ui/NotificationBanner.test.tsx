import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotificationBanner from "./NotificationBanner";

describe("NotificationBanner", () => {
  it("renders primary message", () => {
    render(<NotificationBanner message="Waiting for players..." />);
    expect(screen.getByText("Waiting for players...")).toBeInTheDocument();
  });

  it("renders secondary message when provided", () => {
    render(
      <NotificationBanner
        message="8/10 players"
        secondaryMessage="Waiting for players..."
      />
    );
    expect(screen.getByText("8/10 players")).toBeInTheDocument();
    expect(screen.getByText("Waiting for players...")).toBeInTheDocument();
  });

  it("does not show dismiss button when not dismissible", () => {
    render(<NotificationBanner message="Info" dismissible={false} />);
    expect(screen.queryByRole("button", { name: /dismiss|close/i })).not.toBeInTheDocument();
  });

  it("shows dismiss button when dismissible", () => {
    render(<NotificationBanner message="Info" dismissible />);
    expect(screen.getByRole("button", { name: /dismiss|close/i })).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <NotificationBanner message="Info" dismissible onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByRole("button", { name: /dismiss|close/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
