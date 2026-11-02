import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "cn";

/**
 * The one table style: a surface card with a header row and 64px rows
 * separated by hairlines. Each row is a whole-row link with a chevron.
 * `columns` is a grid-template-columns value shared by header and rows.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface shadow-1", className)}>
      {children}
    </div>
  );
}

export function TableHeader({ columns, children }: { columns: string; children: ReactNode }) {
  return (
    <div
      aria-hidden
      style={{ gridTemplateColumns: columns }}
      className="hidden items-center gap-6 border-b border-border px-5 py-2.5 text-th font-medium text-muted-foreground md:grid"
    >
      {children}
      <span />
    </div>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-border">{children}</ul>;
}

/** Desktop: a grid row matching the header. Below 768px the cells stack as the caller lays them out. */
export function TableRowLink({
  href,
  columns,
  children,
  label,
}: {
  href: string;
  columns: string;
  children: ReactNode;
  /** Accessible name for the whole row. */
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-label={label}
        style={{ "--cols": columns } as React.CSSProperties}
        className="group flex min-h-16 items-center gap-4 px-5 py-3 transition-colors duration-(--dur-1) hover:bg-surface-sunk md:grid md:grid-cols-(--cols) md:gap-6"
      >
        {children}
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 justify-self-end text-muted-foreground transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}
