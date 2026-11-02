import { getDashboardData } from "@/lib/db/queries";
import { PropertyList } from "@/components/property-list";
import { AddPropertyButton } from "@/components/property/add-property-button";
import { Page, PageHeader } from "@/components/shell/page";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const data = await getDashboardData();

  return (
    <Page>
      <PageHeader title="Properties" actions={<AddPropertyButton />} />
      {data.properties.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6 shadow-1">
          <p className="text-muted-foreground">No properties yet. Add your first one to start adding rooms.</p>
          <AddPropertyButton />
        </div>
      ) : (
        <PropertyList properties={data.properties} />
      )}
    </Page>
  );
}
