"use client";

import { type ReactNode } from "react";

export interface HeaderProps {
  title: string;
  /** Optional page title bar (e.g. "建立房間") with yellow bg */
  pageTitle?: string;
  /** Alignment for pageTitle text (default: left) */
  pageTitleAlign?: "left" | "center";
  /** Game screen: use dark red background */
  variant?: "default" | "werewolf" | "success";
  actionIcon?: ReactNode;
  onActionClick?: () => void;
}

export default function Header({
  title,
  pageTitle,
  pageTitleAlign = "left",
  variant = "default",
  actionIcon,
  onActionClick,
}: HeaderProps) {
  const bg =
    variant === "werewolf"
      ? "bg-[var(--background-header-werewolf)]"
      : "bg-[var(--background-primary)]";
  const titleColor =
    variant === "werewolf"
      ? "text-[var(--text-on-dark)]"
      : "text-[var(--accent-primary)]";

  return (
    <header className={bg}>
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className={`text-xl font-bold ${titleColor}`}>{title}</h1>
        {actionIcon != null && (
          <button
            type="button"
            onClick={onActionClick}
            className="text-[var(--text-on-dark)] hover:opacity-80"
            aria-label="操作"
          >
            {actionIcon}
          </button>
        )}
      </div>
      {pageTitle != null && (
        <div
          className={`px-4 py-2 ${
            variant === "success"
              ? "bg-[var(--action-success)]"
              : "bg-[var(--accent-primary)]"
          }`}
        >
          <h2
            className={`text-lg font-medium text-[var(--text-primary)] ${
              pageTitleAlign === "center" ? "text-center" : ""
            }`}
          >
            {pageTitle}
          </h2>
        </div>
      )}
    </header>
  );
}
