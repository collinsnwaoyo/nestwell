const nairaFormatter = new Intl.NumberFormat("en-NG");

/** Formats integer Naira as e.g. ₦280,000. */
export function formatNaira(amount: number): string {
  return `₦${nairaFormatter.format(amount)}`;
}
