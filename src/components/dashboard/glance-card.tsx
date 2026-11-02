import { cn } from "cn";

export type GlanceTone = "chart-1" | "chart-2" | "chart-3" | "chart-4";

const TONE_TEXT: Record<GlanceTone, string> = {
  "chart-1": "text-positive",
  "chart-2": "text-warning",
  "chart-3": "text-info",
  "chart-4": "text-foreground",
};

function Sparkline({ values, tone }: { values: number[]; tone: GlanceTone }) {
  const max = Math.max(...values, 0);
  const points = values
    .map((value, i) => {
      const x = values.length === 1 ? 100 : (i / (values.length - 1)) * 100;
      const y = max === 0 ? 38 : 38 - (value / max) * 34;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={cn("h-12 w-full", TONE_TEXT[tone])} aria-hidden>
      <line
        x1="0"
        y1="38"
        x2="100"
        y2="38"
        className="stroke-muted-foreground/40"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function GlanceCard({
  title,
  caption,
  value,
  tone,
  values,
  axis,
}: {
  title: string;
  caption: string;
  value: string;
  tone: GlanceTone;
  values: number[];
  /** Left label, what the line measures, right label. */
  axis: [string, string, string];
}) {
  return (
    <div className="min-w-0 rounded-lg bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{caption}</p>
        </div>
        <p className={cn("shrink-0 text-2xl leading-none tabular-nums", TONE_TEXT[tone])}>{value}</p>
      </div>
      <div className="mt-4">
        <Sparkline values={values} tone={tone} />
      </div>
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] gap-2 text-[11px] text-muted-foreground">
        <span className="truncate">{axis[0]}</span>
        <span className="font-medium text-foreground/80">{axis[1]}</span>
        <span className="truncate text-right">{axis[2]}</span>
      </div>
    </div>
  );
}
