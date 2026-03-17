"use client";

export interface SegmentedControlSegment {
  id: string;
  label: string;
}

export interface SegmentedControlProps {
  segments: SegmentedControlSegment[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * Segmented control: one active (blue, white text), others inactive (yellow, black text).
 * Used for 重新排序 / 變更房主 etc.
 */
export default function SegmentedControl({
  segments,
  activeId,
  onSelect,
  className = "",
}: SegmentedControlProps) {
  return (
    <div
      className={`flex rounded-lg overflow-hidden [&_button]:flex-1 ${className}`}
      role="group"
      aria-label="Segmented control"
    >
      {segments.map((seg, index) => {
        const isActive = activeId === seg.id;
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;
        const roundClass = isFirst && isLast
          ? "rounded-lg"
          : isFirst
            ? "rounded-l-lg"
            : isLast
              ? "rounded-r-lg"
              : "";
        return (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-active={isActive}
            className={`border-0 bg-[var(--accent-primary)] px-4 py-2.5 text-base font-medium text-[var(--text-on-primary)] transition-colors hover:opacity-90 data-[active=true]:bg-[var(--accent-secondary)] data-[active=true]:text-[var(--text-on-dark)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent-blue)] ${roundClass}`}
            onClick={() => onSelect?.(seg.id)}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
