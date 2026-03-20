"use client";

interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface ActionFooterProps {
  left?: ActionButton;
  center?: ActionButton;
  right?: ActionButton;
  /** dark = night phase, light = day phase */
  variant?: "dark" | "light";
}

export default function ActionFooter({
  left,
  center,
  right,
  variant = "dark",
}: ActionFooterProps) {
  const bgClass =
    variant === "dark"
      ? "bg-[var(--background-primary)] border-t border-white/10"
      : "bg-[var(--background-surface)] border-t border-black/10";

  const textClass =
    variant === "dark" ? "text-[var(--text-on-dark)]" : "text-[var(--text-primary)]";

  const slots = [left, center, right];

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-10 ${bgClass}`}>
      <div className="mx-auto flex max-w-[430px] divide-x divide-white/10">
        {slots.map((slot, idx) => {
          if (!slot) {
            // Empty slot — keep the grid balanced
            return <div key={idx} className="flex-1" />;
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={slot.onClick}
              disabled={slot.disabled}
              className={[
                "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium",
                textClass,
                slot.disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-80 active:opacity-60",
              ].join(" ")}
            >
              {slot.icon && <span>{slot.icon}</span>}
              <span>{slot.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
