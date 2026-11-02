import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import type { PropertySummary } from "@/lib/db/queries";

const COLUMNS = "grid-cols-[minmax(0,1fr)_auto_16px] sm:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_16px]";

/** Properties with free beds first, then alphabetical. */
export function PropertyList({ properties }: { properties: PropertySummary[] }) {
  const sorted = [...properties].sort(
    (a, b) => b.bedsTotal - b.bedsFilled - (a.bedsTotal - a.bedsFilled) || a.name.localeCompare(b.name),
  );

  return (
    <div className="overflow-hidden rounded-lg bg-card">
      <div className={`hidden gap-4 border-b border-border px-4 py-2.5 text-xs text-muted-foreground sm:grid ${COLUMNS}`}>
        <span>Property</span>
        <span>Available</span>
        <span>Occupied</span>
        <span className="text-right">Rent roll</span>
        <span />
      </div>
      <ul className="divide-y divide-border">
        {sorted.map((property) => {
          const available = property.bedsTotal - property.bedsFilled;
          return (
            <li key={property.id}>
              <Link
                href={`/properties/${property.id}`}
                className={`grid items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent ${COLUMNS}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{property.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{property.area}</p>
                </div>
                <p className="text-sm tabular-nums">
                  {available === 0 ? (
                    <span className="text-muted-foreground">Full</span>
                  ) : (
                    <>
                      <span className="sm:hidden">{available} available</span>
                      <span className="hidden sm:inline">
                        {available} bed{available === 1 ? "" : "s"}
                      </span>
                    </>
                  )}
                </p>
                <p className="hidden text-sm text-muted-foreground tabular-nums sm:block">
                  {property.bedsFilled} of {property.bedsTotal}
                </p>
                <p className="hidden text-right text-sm tabular-nums sm:block">{formatNaira(property.rentRoll)}</p>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
