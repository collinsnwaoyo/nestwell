import { formatNaira, getGreeting } from "@/lib/domain";
import { getDashboardData } from "@/lib/db/queries";
import { PropertyCard } from "@/components/property-card";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ownerName = process.env.DEMO_OWNER_NAME || "Collins";
  const greeting = getGreeting(ownerName);
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <BroadcastComposer
          scopeType="portfolio"
          scopeId={null}
          scopeLabel={`Whole portfolio, ${data.bedsFilled} tenant${data.bedsFilled === 1 ? "" : "s"}`}
        />
      </div>

      <div className="mt-3">
        <p className="text-sm text-muted-foreground">Expected revenue this month</p>
        <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
          {formatNaira(data.expectedRevenue)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatNaira(data.collectedSoFar)} collected so far
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-muted/50 p-4">
          <p className="text-2xl font-semibold tabular-nums">{data.propertiesCount}</p>
          <p className="text-sm text-muted-foreground">Properties</p>
        </div>
        <div className="rounded-[20px] bg-muted/50 p-4">
          <p className="text-2xl font-semibold tabular-nums">
            {data.bedsFilled} of {data.bedsTotal}
          </p>
          <p className="text-sm text-muted-foreground">Tenants</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Properties</h2>
        <div className="flex flex-col gap-2">
          {data.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
}
