"use client";

import { type ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Modal overlay with backdrop and centered panel. Uses overlay.dark for backdrop.
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
  className = "",
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-dark)] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-[var(--background-surface)] p-4 shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 pb-2">
          <h2
            id="modal-title"
            className="text-lg font-medium text-[var(--text-primary)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="text-[var(--text-primary)]">{children}</div>
      </div>
    </div>
  );
}
