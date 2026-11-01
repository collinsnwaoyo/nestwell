import { getDashboardData } from "@/lib/db/queries";
import { PropertyCard } from "@/components/property-card";
import { AddPropertyButton } from "@/components/property/add-property-button";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Properties</h1>
        <AddPropertyButton />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {data.properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">No properties yet. Add your first one above.</p>
        ) : (
          data.properties.map((property) => <PropertyCard key={property.id} property={property} />)
        )}
      </div>
    </div>
  );
}
