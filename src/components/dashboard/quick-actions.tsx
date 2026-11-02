"use client";

import Link from "next/link";
import { useCallback, useState, type ComponentType } from "react";
import { AlarmClock, ArrowRight, BedDouble, ChevronRight, DoorOpen, MessageCircle } from "lucide-react";
import { BroadcastComposer } from "@/components/broadcasts/broadcast-composer";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { SidePanel } from "@/components/ui/side-panel";
import { AddRoomForm } from "@/components/property/configure-rooms";
import { formatNaira } from "@/lib/domain";
import type { OverdueTenancy, VacantBed } from "@/lib/db/queries";

type Panel = "add-room" | "overdue" | "add-tenant" | null;

function ActionCard({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-16 overflow-hidden rounded-lg bg-card px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="relative flex items-center gap-1.5 text-sm font-semibold sm:text-[15px]">
        {label}
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </span>
      <Icon className="absolute -right-1.5 -bottom-3 size-12 text-muted-foreground/30" strokeWidth={1.25} />
    </button>
  );
}

function PanelRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg bg-background px-4 py-3 transition-colors hover:bg-accent"
    >
      {children}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function QuickActions({
  properties,
  overdue,
  vacantBeds,
  tenantCount,
}: {
  properties: { id: string; name: string }[];
  overdue: OverdueTenancy[];
  vacantBeds: VacantBed[];
  tenantCount: number;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [roomPropertyId, setRoomPropertyId] = useState(properties[0]?.id ?? "");
  const close = useCallback(() => setPanel(null), []);

  const titles: Record<Exclude<Panel, null>, string> = {
    "add-room": "Add a room",
    overdue: "Overdue rent",
    "add-tenant": "Add a tenant",
  };
  const descriptions: Record<Exclude<Panel, null>, string> = {
    "add-room": "Pick the property, then the room type.",
    overdue: `${overdue.length} tenant${overdue.length === 1 ? "" : "s"} behind on rent`,
    "add-tenant": `${vacantBeds.length} vacant bed${vacantBeds.length === 1 ? "" : "s"}`,
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <BroadcastComposer
          scopeType="portfolio"
          scopeId={null}
          scopeLabel={`Whole portfolio, ${tenantCount} tenant${tenantCount === 1 ? "" : "s"}`}
          renderTrigger={(open) => <ActionCard label="Send message" icon={MessageCircle} onClick={open} />}
        />
        <ActionCard label="Add a room" icon={DoorOpen} onClick={() => setPanel("add-room")} />
        <ActionCard label="View overdue" icon={AlarmClock} onClick={() => setPanel("overdue")} />
        <ActionCard label="Add a tenant" icon={BedDouble} onClick={() => setPanel("add-tenant")} />
      </div>

      <SidePanel
        open={panel !== null}
        onClose={close}
        title={panel ? titles[panel] : ""}
        description={panel ? descriptions[panel] : undefined}
      >
        {panel === "add-room" &&
          (properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a property first.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <FormField label="Property" htmlFor="quick-room-property">
                <select
                  id="quick-room-property"
                  className={inputClass}
                  value={roomPropertyId}
                  onChange={(event) => setRoomPropertyId(event.target.value)}
                >
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <AddRoomForm key={roomPropertyId} propertyId={roomPropertyId} onDone={close} />
            </div>
          ))}

        {panel === "overdue" &&
          (overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody is overdue. Everyone is within their grace period.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {overdue.map((item) => (
                <PanelRow key={item.bedId} href={`/properties/${item.propertyId}?bed=${item.bedId}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.tenantName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.propertyName} · {item.roomName} · {item.daysLate} day{item.daysLate === 1 ? "" : "s"}{" "}
                      late
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium tabular-nums">{formatNaira(item.balance)}</span>
                    <StatusChip status="overdue" />
                  </div>
                </PanelRow>
              ))}
            </div>
          ))}

        {panel === "add-tenant" &&
          (vacantBeds.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">Every bed is filled. Add a room to make space.</p>
              <Button type="button" variant="outline" onClick={() => setPanel("add-room")}>
                Add a room
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {vacantBeds.map((bed) => (
                <PanelRow key={bed.bedId} href={`/properties/${bed.propertyId}?bed=${bed.bedId}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{bed.propertyName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {bed.roomName} · {bed.bedLabel} · {formatNaira(bed.rentPerBed)}/month
                    </p>
                  </div>
                  <StatusChip status="vacant" />
                </PanelRow>
              ))}
            </div>
          ))}
      </SidePanel>
    </>
  );
}
