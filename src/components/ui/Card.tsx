import { type ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Panel/card with surface background and rounded corners (design token radius).
 */
export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg bg-[var(--background-surface)] p-4 text-[var(--text-primary)] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
