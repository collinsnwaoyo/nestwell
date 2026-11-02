import type { ReactNode } from "react";

/** Text inputs, selects and textareas share one look with the secondary button. */
export const inputClass =
  "w-full min-h-9 rounded-md border border-border-strong bg-surface px-3 py-[7px] text-body outline-none transition-[border-color,box-shadow] duration-(--dur-1) placeholder:text-faint hover:border-faint disabled:cursor-not-allowed disabled:opacity-50 max-md:min-h-11";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-body font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-meta-style">{hint}</span>}
      {error && <span className="text-meta text-danger">{error}</span>}
    </div>
  );
}
