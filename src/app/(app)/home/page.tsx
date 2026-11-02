import { formatNaira, getGreeting } from "@/lib/domain";
import { getDashboardData } from "@/lib/db/queries";
import { PropertyCard } from "@/components/property-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ownerName = process.env.DEMO_OWNER_NAME || "Collins";
  const greeting = getGreeting(ownerName);
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.1] font-bold tracking-tight">
        {greeting}
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Properties</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">{data.propertiesCount}</p>
        </div>
        <div className="min-w-0 rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">Tenants</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">
            {data.bedsFilled} <span className="text-muted-foreground">of {data.bedsTotal}</span>
          </p>
        </div>
        <div className="col-span-2 min-w-0 rounded-lg border border-border bg-card p-5 sm:col-span-1">
          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
          <p className="mt-1.5 truncate text-xl font-semibold tabular-nums sm:text-2xl">
            {formatNaira(data.expectedRevenue)}
          </p>
          <p className="mt-0.5 truncate text-sm tabular-nums text-primary">
            {formatNaira(data.collectedSoFar)} collected
          </p>
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
