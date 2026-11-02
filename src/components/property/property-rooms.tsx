"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { Pencil, Settings2 } from "lucide-react";
import { formatNaira, getDaysUntilDue, toLagosDate } from "@/lib/domain";
import type { RoomDetail } from "@/lib/db/queries";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { OccupancyBar } from "@/components/property-list";
import { PageHeader } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfigureRooms } from "./configure-rooms";
import { RoomCard } from "./room-card";
import { TenantPanelContent } from "./tenant-panel";

type Panel = { kind: "bed"; bedId: string } | { kind: "configure" } | null;

function summarise(rooms: RoomDetail[]) {
  const beds = rooms.flatMap((room) => room.beds);
  const occupied = beds.filter((bed) => bed.tenant);
  const rentRoll = occupied.reduce((sum, bed) => sum + (bed.rent ?? 0), 0);
  const today = new Date();
  const upcoming = occupied
    .map((bed) => bed.nextDueDate)
    .filter((date): date is string => !!date && getDaysUntilDue(date, today) >= 0)
    .sort();
  return {
    beds: beds.length,
    occupied: occupied.length,
    rentRoll,
    nextDue: upcoming[0] ? format(toLagosDate(upcoming[0]), "d MMM") : null,
  };
}

export function PropertyRooms({
  propertyId,
  propertyName,
  meta,
  rooms,
  initialBedId,
}: {
  propertyId: string;
  propertyName: string;
  /** "Area · Active since Month Year" under the title. */
  meta: string;
  rooms: RoomDetail[];
  /** Opens that bed's drawer on arrival, e.g. from a Home link. */
  initialBedId?: string;
}) {
  const [panel, setPanelState] = useState<Panel>(initialBedId ? { kind: "bed", bedId: initialBedId } : null);
  const [editing, setEditing] = useState(false);
  const setPanel = useCallback((next: Panel) => {
    setPanelState(next);
    setEditing(false);
  }, []);
  const close = useCallback(() => setPanel(null), [setPanel]);

  const summary = summarise(rooms);
  const selected =
    panel?.kind === "bed"
      ? rooms.flatMap((room) => room.beds.map((bed) => ({ room, bed }))).find(({ bed }) => bed.id === panel.bedId)
      : undefined;

  const title =
    panel?.kind === "configure" ? "Configure rooms" : selected?.bed.tenant ? selected.bed.tenant.fullName : "Add tenant";
  const description =
    panel?.kind === "configure"
      ? propertyName
      : selected && `${selected.room.name} · ${selected.bed.label.startsWith("Bed") ? selected.bed.label : "Bed"}`;

  const summaryLine = [
    `${summary.beds} bed${summary.beds === 1 ? "" : "s"}`,
    `${summary.occupied} occupied`,
    `${formatNaira(summary.rentRoll)} rent roll`,
    summary.nextDue && `next due ${summary.nextDue}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        title={propertyName}
        meta={meta}
        actions={
          <>
            <BroadcastComposer
              scopeType="property"
              scopeId={propertyId}
              scopeLabel={`${propertyName}, ${summary.occupied} tenant${summary.occupied === 1 ? "" : "s"}`}
              triggerLabel="Send message"
            />
            <Button type="button" variant="secondary" onClick={() => setPanel({ kind: "configure" })}>
              <Settings2 aria-hidden /> Configure rooms
            </Button>
          </>
        }
      />

      <p className="-mt-5 mb-8 text-meta-style tabular-nums lg:hidden">{summaryLine}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-10">
        <section aria-labelledby="rooms-title" className="min-w-0">
          <h2 id="rooms-title" className="mb-3 text-h2 font-semibold">
            Rooms
          </h2>
          {rooms.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6 shadow-1">
              <p className="text-muted-foreground">No rooms yet. Add the first one to start placing tenants.</p>
              <Button type="button" onClick={() => setPanel({ kind: "configure" })}>
                Add the first room
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  propertyId={propertyId}
                  selectedBedId={panel?.kind === "bed" ? panel.bedId : null}
                  onSelectBed={(bedId) => setPanel({ kind: "bed", bedId })}
                />
              ))}
            </div>
          )}
        </section>

        <aside aria-labelledby="summary-title" className="hidden min-w-0 lg:block">
          <h2 id="summary-title" className="mb-3 text-h2 font-semibold">
            Summary
          </h2>
          <dl className="divide-y divide-border rounded-lg border border-border bg-surface shadow-1">
            <div className="px-5 py-4">
              <dt className="text-meta-style">Occupancy</dt>
              <dd className="mt-0.5 font-medium">
                {summary.occupied} of {summary.beds} beds
              </dd>
              <OccupancyBar filled={summary.occupied} total={summary.beds} className="mt-2 w-full" />
            </div>
            <div className="px-5 py-4">
              <dt className="text-meta-style">Rent roll</dt>
              <dd className="mt-0.5 text-stat-sm font-semibold">{formatNaira(summary.rentRoll)}</dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-meta-style">Next due</dt>
              <dd className="mt-0.5 font-medium">{summary.nextDue ?? "Nothing upcoming"}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <Drawer
        open={panel !== null}
        onClose={close}
        title={title}
        description={description}
        tall={panel?.kind === "bed"}
        actions={
          selected?.bed.tenant && !editing ? (
            <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil aria-hidden /> Edit
            </Button>
          ) : undefined
        }
      >
        {panel?.kind === "configure" && <ConfigureRooms propertyId={propertyId} rooms={rooms} />}
        {selected && (
          <TenantPanelContent
            key={selected.bed.id}
            bed={selected.bed}
            propertyId={propertyId}
            rentPerBed={selected.room.rentPerBed}
            editing={editing}
            onEditingChange={setEditing}
            onClose={close}
          />
        )}
      </Drawer>
    </>
  );
}
