import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getPropertyDetail } from "@/lib/db/queries";
import { PropertyRooms } from "@/components/property/property-rooms";

export const dynamic = "force-dynamic";

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bed?: string }>;
}) {
  const [{ id }, { bed }] = await Promise.all([params, searchParams]);
  const property = await getPropertyDetail(id);
  if (!property) notFound();

  const bedExists = property.rooms.some((room) => room.beds.some((b) => b.id === bed));

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="text-[1.625rem] leading-tight font-bold tracking-tight">{property.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {property.area} · Active since {format(new Date(property.activeSince), "MMMM yyyy")}
      </p>

      <div className="mt-6">
        <PropertyRooms
          propertyId={property.id}
          propertyName={property.name}
          rooms={property.rooms}
          initialBedId={bedExists ? bed : undefined}
        />
      </div>
    </div>
  );
}
