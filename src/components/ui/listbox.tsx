"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { moveFocus } from "./popover";

/**
 * A labelled single-choice list (a styled replacement for a native select),
 * used inside popovers. Arrow keys move, Enter or Space picks.
 */
export function Listbox({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  return (
    <div>
      <p id={labelId} className="px-2.5 pt-2 pb-1 text-meta-style font-medium">
        {label}
      </p>
      <div
        role="listbox"
        aria-labelledby={labelId}
        onKeyDown={(event) => moveFocus(event, '[role="option"]')}
        className="flex max-h-44 flex-col overflow-y-auto"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-h-8 items-center justify-between gap-3 rounded-md px-2.5 text-left text-body transition-colors duration-(--dur-1) hover:bg-surface-sunk focus-visible:bg-surface-sunk max-md:min-h-11",
                selected ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="truncate">{option.label}</span>
              {selected && <Check aria-hidden className="size-4 shrink-0 text-positive" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
