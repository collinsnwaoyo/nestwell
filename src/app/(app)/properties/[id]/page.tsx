import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getPropertyDetail } from "@/lib/db/queries";
import { PropertyRooms } from "@/components/property/property-rooms";
import { Page } from "@/components/shell/page";

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
    <Page>
      <PropertyRooms
        propertyId={property.id}
        propertyName={property.name}
        meta={`${property.area} · Active since ${format(new Date(property.activeSince), "MMMM yyyy")}`}
        rooms={property.rooms}
        initialBedId={bedExists ? bed : undefined}
      />
    </Page>
  );
}
