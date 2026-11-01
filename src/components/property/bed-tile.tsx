import { cn } from "cn";
import type { RentStatus } from "@/lib/domain";

// Filled version of the status palette, for small tiles rather than chips.
const TILE_STYLES: Record<RentStatus, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  due_soon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  due_today: "bg-amber-500/20 text-amber-800 dark:text-amber-200",
  overdue: "bg-red-500/15 text-red-700 dark:text-red-300",
  notice: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  vacant: "border border-dashed border-muted-foreground/30 text-muted-foreground",
};

export interface BedTileData {
  id: string;
  label: string;
  status: RentStatus;
  tenantFirstName: string | null;
}

export function BedTile({ bed, onSelect }: { bed: BedTileData; onSelect: (bedId: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bed.id)}
      className={cn(
        "flex min-w-[88px] flex-col items-start gap-0.5 rounded-2xl p-3 text-left transition-opacity hover:opacity-80",
        TILE_STYLES[bed.status],
      )}
    >
      <span className="text-xs font-medium opacity-70">{bed.label}</span>
      <span className="truncate text-sm font-semibold">{bed.tenantFirstName ?? "Vacant"}</span>
    </button>
  );
}
