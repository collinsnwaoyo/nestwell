import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { describeDue, getGreeting, toLagosDate } from "@/lib/domain";
import { getDashboardData } from "@/lib/db/queries";
import { IntroDone } from "@/components/dashboard/intro-done";
import { NeedsAttention, type AttentionItem } from "@/components/dashboard/needs-attention";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RevenuePanel } from "@/components/dashboard/revenue-panel";
import { StatStrip } from "@/components/dashboard/stat-strip";
import { Page, Section } from "@/components/shell/page";

export const dynamic = "force-dynamic";

const ATTENTION_LIMIT = 5;
const NEEDS_ACTION = new Set(["overdue", "notice", "due_today", "due_soon"]);

export default async function HomePage() {
  const ownerName = process.env.DEMO_OWNER_NAME || "Collins";
  const [greetingLabel, greetingName] = getGreeting(ownerName).split(/, (.*)/);
  const today = new Date();
  const data = await getDashboardData(today);

  // Late and due tenants first (most late first), then empty beds.
  const attention: AttentionItem[] = [
    ...data.payable
      .filter((item) => NEEDS_ACTION.has(item.status))
      .map((item) => ({
        key: item.tenancyId,
        name: item.tenantName,
        // The pill already says due today; the detail adds how late or when.
        detail:
          item.daysUntilDue === 0
            ? item.propertyName
            : `${item.propertyName}, ${describeDue(item.daysUntilDue, item.nextDueDate).toLowerCase()}`,
        status: item.status,
        href: `/properties/${item.propertyId}?bed=${item.bedId}`,
        tenancyId: item.tenancyId,
      })),
    ...data.vacantBeds.map((bed) => ({
      key: bed.bedId,
      name: bed.propertyName,
      // Single-bed rooms label their only bed "Room" or "Studio"; the room name says enough.
      detail: bed.bedLabel.startsWith("Bed") ? `${bed.roomName}, ${bed.bedLabel}` : bed.roomName,
      status: "vacant" as const,
      href: `/properties/${bed.propertyId}?bed=${bed.bedId}`,
    })),
  ].slice(0, ATTENTION_LIMIT);

  const bedsFree = data.bedsTotal - data.bedsFilled;

  return (
    <Page>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="text-display">
          <span className="block font-normal text-muted-foreground xl:inline">{greetingLabel}, </span>
          <span className="block font-semibold xl:inline">{greetingName}</span>
        </h1>
        <p className="text-meta-style">{format(toLagosDate(today), "EEEE, d MMMM")}</p>
      </header>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <RevenuePanel
            collected={data.collectedLast30Days}
            previous={data.collectedPrevious30Days}
            daily={data.revenueDaily}
          />
          <StatStrip
            paymentsDue={data.paymentsDueCount}
            overdue={data.overdueCount}
            bedsFilled={data.bedsFilled}
            bedsTotal={data.bedsTotal}
            rentRoll={data.expectedRevenue}
            properties={data.propertiesCount}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <Section title="Needs attention">
            <NeedsAttention items={attention} />
          </Section>
          <Section title="Quick actions">
            <QuickActions
              payable={data.payable}
              overdue={data.overdue}
              vacantBeds={data.vacantBeds}
              tenantCount={data.bedsFilled}
            />
          </Section>
          <Link
            href="/properties"
            className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-1 transition-shadow duration-(--dur-1) hover:shadow-2"
          >
            <span>
              <span className="font-medium">
                {data.propertiesCount} propert{data.propertiesCount === 1 ? "y" : "ies"}
              </span>
              <span className="text-muted-foreground">
                , {bedsFree} bed{bedsFree === 1 ? "" : "s"} free
              </span>
            </span>
            <ArrowRight
              aria-hidden
              className="size-4 text-muted-foreground transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
      <IntroDone />
    </Page>
  );
}
