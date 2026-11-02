/** The Nestwell mark: a roof glyph in a 20px rounded square. */
export function BrandMark() {
  return (
    <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-[5px] bg-primary">
      <svg viewBox="0 0 12 12" className="size-3 text-primary-foreground" fill="none">
        <path
          d="M2 6.25 6 3l4 3.25M3.25 5.5V9.5h5.5V5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
