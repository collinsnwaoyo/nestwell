import { Building2, ChevronRight, MessageCircle, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { formatNaira, getGreeting } from "@/lib/domain";
import { getDashboardData } from "@/lib/db/queries";
import { PropertyCard } from "@/components/property-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ownerName = process.env.DEMO_OWNER_NAME || "Collins";
  const greeting = getGreeting(ownerName);
  const [greetingLabel, greetingName] = greeting.split(/, (.*)/);
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <p className="text-sm font-medium text-muted-foreground">{greetingLabel},</p>
      <h1 className="mt-0.5 text-[clamp(1.5rem,4vw,2rem)] leading-[1.15] font-bold tracking-tight">
        {greetingName}
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-lg border border-border bg-card p-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Building2 className="size-4.5" />
          </div>
          <p className="mt-3 text-sm font-medium text-muted-foreground">Properties</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.propertiesCount}</p>
        </div>
        <div className="min-w-0 rounded-lg border border-border bg-card p-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Users className="size-4.5" />
          </div>
          <p className="mt-3 text-sm font-medium text-muted-foreground">Tenants</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {data.bedsFilled} <span className="text-muted-foreground">of {data.bedsTotal}</span>
          </p>
        </div>
        <div className="col-span-2 min-w-0 rounded-lg border border-border bg-card p-5 sm:col-span-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4.5" />
          </div>
          <p className="mt-3 text-sm font-medium text-muted-foreground">Revenue</p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums sm:text-2xl">
            {formatNaira(data.expectedRevenue)}
          </p>
          <p className="mt-0.5 truncate text-sm tabular-nums text-primary">
            {formatNaira(data.collectedSoFar)} collected
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link
          href="/properties"
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Building2 className="size-4.5" />
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">Properties</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
        <Link
          href="/messages"
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
            <MessageCircle className="size-4.5" />
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">Messages</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-[1.0625rem] font-semibold">Properties</h2>
        <div className="flex flex-col gap-2">
          {data.properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </div>
  );
}
