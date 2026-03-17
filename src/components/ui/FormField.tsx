"use client";

import { type InputHTMLAttributes, type ReactNode } from "react";

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  infoIcon?: ReactNode;
  onInfoClick?: () => void;
}

export default function FormField({
  label,
  infoIcon,
  onInfoClick,
  id,
  className = "",
  ...inputProps
}: FormFieldProps) {
  const fieldId = id ?? `field-${label.replace(/\s/g, "-")}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label
          htmlFor={fieldId}
          className="text-base font-bold text-[var(--text-secondary)]"
        >
          {label}
        </label>
        {infoIcon != null && (
          <button
            type="button"
            onClick={onInfoClick}
            className="text-[var(--accent-blue)] outline-none hover:opacity-80"
            aria-label="更多說明"
          >
            {infoIcon}
          </button>
        )}
      </div>
      <input
        id={fieldId}
        className={`rounded-lg border border-gray-200 bg-[var(--background-surface)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue)] ${className}`}
        {...inputProps}
      />
    </div>
  );
}
