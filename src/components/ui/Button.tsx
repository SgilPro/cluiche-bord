"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "segment";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-primary)] text-[var(--text-on-primary)] hover:opacity-90",
  secondary:
    "bg-[var(--accent-secondary)] text-[var(--text-on-dark)] hover:opacity-90",
  success:
    "bg-[var(--action-success)] text-[var(--text-on-dark)] hover:opacity-90",
  danger:
    "bg-[var(--action-danger)] text-[var(--text-on-dark)] hover:opacity-90",
  segment:
    "bg-[var(--accent-primary)] text-[var(--text-on-primary)] data-[active=true]:bg-[var(--accent-blue)] data-[active=true]:text-[var(--text-on-dark)]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  active?: boolean;
}

export default function Button({
  variant = "primary",
  leftIcon,
  fullWidth,
  active,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium transition-opacity disabled:opacity-50";
  const width = fullWidth ? "w-full" : "";
  const dataActive = variant === "segment" ? { "data-active": active } : {};

  return (
    <button
      type="button"
      className={`${base} ${width} ${variantClasses[variant]} ${className}`}
      data-active={variant === "segment" ? active : undefined}
      {...dataActive}
      {...props}
    >
      {leftIcon != null ? <span className="shrink-0">{leftIcon}</span> : null}
      {children}
    </button>
  );
}
