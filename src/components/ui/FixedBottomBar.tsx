import { Children, type ReactNode } from "react";

export interface FixedBottomBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  /**
   * Layout mode:
   * - "equal": wrap each child in flex-1 (default, e.g. Leave | Start)
   * - "raw": render children as-is (for ticket-style 104px buttons, etc.)
   */
  mode?: "equal" | "raw";
}

/**
 * Fixed bottom bar with primary actions.
 * Use with Button components: left often danger, right often success.
 */
export default function FixedBottomBar({
  children,
  className = "",
  mode = "equal",
}: FixedBottomBarProps) {
  return (
    <footer
      className={`fixed bottom-0 left-1/2 flex w-full max-w-[430px] -translate-x-1/2 shadow-[0_-2px_8px_rgba(0,0,0,0.15)] ${className}`}
    >
      {mode === "raw"
        ? children
        : Children.map(Children.toArray(children), (child) => (
            <div className="min-w-0 flex-1">{child}</div>
          ))}
    </footer>
  );
}
