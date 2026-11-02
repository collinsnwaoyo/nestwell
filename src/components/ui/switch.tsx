"use client";

import { cn } from "cn";

/** 32x18 toggle. The thumb slides with a transform; the track colour crossfades. On is positive green. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-[background-color] duration-(--dur-2) ease-out disabled:opacity-50",
        "after:absolute after:-inset-x-1 after:-inset-y-[11px] after:content-['']",
        checked ? "bg-positive" : "bg-border-strong",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-3.5 rounded-full bg-surface shadow-1 transition-transform duration-(--dur-2) ease-out",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
