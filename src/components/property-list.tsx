import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/domain";
import type { PropertySummary } from "@/lib/db/queries";
import { Table, TableBody, TableHeader, TableRowLink } from "@/components/ui/table";

const COLUMNS = "minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) 16px";

/** "2 of 3 beds" with a 64px bar: green when full, neutral otherwise. */
export function OccupancyBar({ filled, total, className }: { filled: number; total: number; className?: string }) {
  const full = total > 0 && filled === total;
  return (
    <span
      role="presentation"
      className={cn("block h-1 w-16 overflow-hidden rounded-full bg-neutral-bg", className)}
    >
      <span
        className={cn("block h-full origin-left rounded-full", full ? "bg-positive" : "bg-faint")}
        style={{ transform: `scaleX(${total === 0 ? 0 : filled / total})` }}
      />
    </span>
  );
}

/** Properties with free beds first, then alphabetical. */
export function PropertyList({ properties }: { properties: PropertySummary[] }) {
  const sorted = [...properties].sort(
    (a, b) => b.bedsTotal - b.bedsFilled - (a.bedsTotal - a.bedsFilled) || a.name.localeCompare(b.name),
  );

  return (
    <Table>
      <TableHeader columns={COLUMNS}>
        <span>Property</span>
        <span>Occupancy</span>
        <span className="text-right">Rent roll</span>
      </TableHeader>
      <TableBody>
        {sorted.map((property, index) => {
          const free = property.bedsTotal - property.bedsFilled;
          const occupancy = `${property.bedsFilled} of ${property.bedsTotal} beds`;
          return (
            <TableRowLink
              key={property.id}
              index={index}
              href={`/properties/${property.id}`}
              columns={COLUMNS}
              label={`${property.name}, ${property.area}. ${occupancy}${free > 0 ? `, ${free} free` : ""}. Rent roll ${formatNaira(property.rentRoll)}`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{property.name}</p>
                <p className="truncate text-meta-style">{property.area}</p>
              </div>

              {/* Desktop occupancy cell */}
              <div className="hidden min-w-0 md:block">
                <p className="tabular-nums">{occupancy}</p>
                <OccupancyBar filled={property.bedsFilled} total={property.bedsTotal} className="my-1.5" />
                {free > 0 && (
                  <p className="text-meta-style tabular-nums">
                    {free} bed{free === 1 ? "" : "s"} free
                  </p>
                )}
              </div>
              <p className="hidden text-right font-medium tabular-nums md:block">{formatNaira(property.rentRoll)}</p>

              {/* Phone: rent roll and occupancy stacked on the right */}
              <div className="shrink-0 text-right md:hidden">
                <p className="font-medium tabular-nums">{formatNaira(property.rentRoll)}</p>
                <p className="text-meta-style tabular-nums">{occupancy}</p>
              </div>
            </TableRowLink>
          );
        })}
      </TableBody>
    </Table>
  );
}
