import { type ReactNode } from "react";

export type CardVariant = "default" | "ticket" | "surface";

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-[var(--background-surface)] text-[var(--text-primary)] shadow-sm",
  ticket: "bg-[var(--background-muted)] text-[var(--text-on-dark)] rounded-lg border-2 border-dashed border-[var(--border-ticket-color)]",
  surface: "bg-[var(--background-surface)] text-[var(--text-primary)] border border-gray-100 shadow-sm",
};

export default function Card({ children, className = "", variant = "default" }: CardProps) {
  return (
    <div className={`rounded-lg p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
