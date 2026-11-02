import { cn } from "@/lib/utils";

/** The Nestwell mark: a roof glyph in a rounded square. 20px in the sidebar; larger on the welcome screen. */
export function BrandMark({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary",
        large ? "size-14 rounded-lg shadow-1" : "size-5 rounded-[5px]",
      )}
    >
      <svg viewBox="0 0 12 12" className={cn("text-primary-foreground", large ? "size-8" : "size-3")} fill="none">
        <path
          d="M2 6.25 6 3l4 3.25M3.25 5.5V9.5h5.5V5.5"
          stroke="currentColor"
          strokeWidth={large ? 2.5 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
