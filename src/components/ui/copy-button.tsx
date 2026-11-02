"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Tooltip } from "./tooltip";

/** Copies a value (an email, a phone number) that may be truncated on screen. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Couldn't copy the ${label.toLowerCase()}`);
    }
  }

  return (
    <Tooltip content={`Copy ${label.toLowerCase()}`}>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="relative flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-(--dur-1) after:absolute after:-inset-2 after:content-[''] hover:bg-surface-sunk hover:text-foreground"
      >
        <Copy aria-hidden className="size-3.5" />
      </button>
    </Tooltip>
  );
}
