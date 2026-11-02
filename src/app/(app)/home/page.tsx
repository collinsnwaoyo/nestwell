import { addDays, format } from "date-fns";
import { formatNaira, getGreeting, toLagosDate } from "@/lib/domain";
import { DUE_HORIZON_DAYS, getDashboardData } from "@/lib/db/queries";
import { GlanceCard } from "@/components/dashboard/glance-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Section } from "@/components/dashboard/section";
import { PropertyList } from "@/components/property-list";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ownerName = process.env.DEMO_OWNER_NAME || "Collins";
  const [greetingLabel, greetingName] = getGreeting(ownerName).split(/, (.*)/);
  const today = new Date();
  const data = await getDashboardData(today);

  const lagosToday = toLagosDate(today);
  const historyStart = format(toLagosDate(data.seriesStart), "d MMM");
  const vacant = data.bedsTotal - data.bedsFilled;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="text-[1.625rem] leading-tight tracking-tight">
        <span className="block text-muted-foreground">{greetingLabel},</span>
        <span className="block font-bold">{greetingName}</span>
      </h1>

      <div className="mt-8 flex flex-col gap-8">
        <Section
          title="At a glance"
          aside={<span className="text-sm text-muted-foreground">{format(lagosToday, "EEE, d MMM")}</span>}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <GlanceCard
              title="Revenue"
              caption="Last 30 days"
              value={formatNaira(data.collectedLast30Days)}
              tone="chart-1"
              values={data.series.collected}
              axis={[historyStart, "Collected", "Today"]}
            />
            <GlanceCard
              title="Payments due"
              caption={data.overdueCount > 0 ? `${data.overdueCount} overdue` : "None overdue"}
              value={String(data.paymentsDueCount)}
              tone="chart-2"
              values={data.series.due}
              axis={["Today", "Rent falling due", format(addDays(lagosToday, DUE_HORIZON_DAYS), "d MMM")]}
            />
            <GlanceCard
              title="Vacant beds"
              caption={`${data.bedsFilled} of ${data.bedsTotal} beds filled`}
              value={String(vacant)}
              tone="chart-3"
              values={data.series.vacant}
              axis={[historyStart, "Vacant", "Today"]}
            />
            <GlanceCard
              title="Properties"
              caption={`${formatNaira(data.expectedRevenue)} rent roll`}
              value={String(data.propertiesCount)}
              tone="chart-4"
              values={data.series.rentRoll}
              axis={[historyStart, "Rent roll", "Today"]}
            />
          </div>
        </Section>

        <Section title="Quick actions">
          <QuickActions
            payable={data.payable}
            overdue={data.overdue}
            vacantBeds={data.vacantBeds}
            tenantCount={data.bedsFilled}
          />
        </Section>

        <Section title="Properties">
          {data.properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No properties yet. Add one from the Properties page.</p>
          ) : (
            <PropertyList properties={data.properties} />
          )}
        </Section>
      </div>
    </div>
  );
}
