import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Building2 } from "lucide-react";
import { getPropertyDetail } from "@/lib/db/queries";
import { PropertyRooms } from "@/components/property/property-rooms";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyDetail(id);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <Building2 className="size-5.5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[clamp(1.375rem,3.5vw,1.75rem)] leading-tight font-bold tracking-tight">
            {property.name}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {property.area} · Active since {format(new Date(property.activeSince), "MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <PropertyRooms propertyId={property.id} propertyName={property.name} rooms={property.rooms} />
      </div>
    </div>
  );
}
