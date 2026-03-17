import { type ReactNode } from "react";

export interface MobileContainerProps {
  children: ReactNode;
  /** Extra class for the outer wrapper (e.g. bg) */
  className?: string;
}

/**
 * Mobile-first layout: content constrained to ~430px, centered on desktop.
 * Use as the main page wrapper so inputs/buttons don't stretch on large screens.
 */
export default function MobileContainer({
  children,
  className = "",
}: MobileContainerProps) {
  return (
    <div
      className={`flex min-h-screen w-full justify-center bg-[var(--background-primary)] ${className}`}
    >
      <div className="flex min-h-screen w-full max-w-[430px] flex-col">
        {children}
      </div>
    </div>
  );
}
