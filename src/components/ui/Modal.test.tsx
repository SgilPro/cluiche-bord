import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Modal from "./Modal";

describe("Modal", () => {
  it("renders title and children when open", () => {
    render(
      <Modal open title="Confirm" onClose={() => {}}>
        <p>Are you sure?</p>
      </Modal>
    );
    expect(screen.getByRole("dialog", { name: "Confirm" })).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <Modal open={false} title="Confirm" onClose={() => {}}>
        <p>Hidden</p>
      </Modal>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Dialog" onClose={onClose}>
        Content
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Dialog" onClose={onClose}>
        Content
      </Modal>
    );
    fireEvent.click(screen.getByRole("button", { name: /close|dismiss/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
