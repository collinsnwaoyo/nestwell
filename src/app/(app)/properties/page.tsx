import { getDashboardData } from "@/lib/db/queries";
import { PropertyList } from "@/components/property-list";
import { AddPropertyButton } from "@/components/property/add-property-button";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[1.625rem] leading-tight font-bold tracking-tight">Properties</h1>
        <AddPropertyButton />
      </div>

      <div className="mt-6">
        {data.properties.length === 0 ? (
          <div className="rounded-lg bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No properties yet. Add your first one to start adding rooms.</p>
          </div>
        ) : (
          <PropertyList properties={data.properties} />
        )}
      </div>
    </div>
  );
}
