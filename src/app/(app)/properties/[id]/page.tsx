import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { getPropertyDetail } from "@/lib/db/queries";
import { EditPropertyButton } from "@/components/property/edit-property-button";
import { PropertyRooms } from "@/components/property/property-rooms";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyDetail(id);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Building2 className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{property.name}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {property.area} · {property.address}
          </p>
        </div>
        <EditPropertyButton
          propertyId={property.id}
          name={property.name}
          area={property.area}
          address={property.address}
        />
      </div>

      <div className="mt-8">
        <PropertyRooms propertyId={property.id} rooms={property.rooms} />
      </div>
    </div>
  );
}
