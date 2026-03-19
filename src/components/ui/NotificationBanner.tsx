"use client";

import { ChevronsDownUp } from "lucide-react";

export interface NotificationBannerProps {
  message: string;
  secondaryMessage?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export default function NotificationBanner({
  message,
  secondaryMessage,
  dismissible = false,
  onDismiss,
}: NotificationBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 bg-[var(--background-surface)] px-4 py-3 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 flex-1">
        {secondaryMessage != null && (
          <p className="text-sm text-[var(--text-secondary)]">
            {secondaryMessage}
          </p>
        )}
        <p className="text-[var(--text-primary)]">{message}</p>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-[var(--text-secondary)] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
          aria-label="Dismiss"
        >
          <ChevronsDownUp size={18} aria-hidden />
        </button>
      )}
    </div>
  );
}
