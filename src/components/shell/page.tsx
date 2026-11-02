import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * The one page frame: aligned to the sidebar (never centred in the leftover
 * space), 40px side padding from 768px, at most 1200px wide.
 */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("w-full max-w-[1200px] px-5 py-6 md:px-10 md:py-10", className)}>{children}</div>;
}

/** Title (and optional meta line) on the left, actions on the right, 32px above the content. */
export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-display font-semibold">{title}</h1>
        {meta && <p className="mt-1 text-meta-style">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 max-sm:w-full">{actions}</div>}
    </header>
  );
}

/** A section within a page: H2 title with an optional aside, then content. */
export function Section({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-h2 font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
