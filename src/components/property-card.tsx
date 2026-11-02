import Link from "next/link";
import { Building2 } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import type { PropertySummary } from "@/lib/db/queries";
import { StatusChip } from "./status-chip";

export function PropertyCard({ property }: { property: PropertySummary }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Building2 className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{property.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {property.area} · {property.bedsFilled} of {property.bedsTotal} beds
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="font-medium tabular-nums">
          {property.amountOwed > 0 ? formatNaira(property.amountOwed) : "—"}
        </p>
        {property.flag && <StatusChip status={property.flag} />}
      </div>
    </Link>
  );
}
