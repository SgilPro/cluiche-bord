import { Children, type ReactNode } from "react";

export interface FixedBottomBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Fixed bottom bar with two equal-width action buttons (e.g. Leave | Start).
 * Use with Button components: left often danger, right often success.
 */
export default function FixedBottomBar({
  children,
  className = "",
}: FixedBottomBarProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 flex gap-2 bg-[var(--background-surface)] p-4 shadow-[0_-2px_8px_rgba(0,0,0,0.15)] ${className}`}
      role="group"
      aria-label="Bottom actions"
    >
      {Children.map(Children.toArray(children), (child) => (
        <div className="min-w-0 flex-1">{child}</div>
      ))}
    </div>
  );
}
