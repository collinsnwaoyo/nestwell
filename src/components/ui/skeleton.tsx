import { cn } from "cn";

/** A placeholder block shown while a page's data loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-skeleton rounded-md bg-surface-sunk", className)} />;
}

/** Page shell for route loading states: same width and padding as the real pages. */
export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[1200px] px-5 py-6 md:px-10 md:py-10" role="status" aria-label="Loading">
      {children}
    </div>
  );
}

/** A list container with hairline-separated rows, like PropertyList and room cards. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-1">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
