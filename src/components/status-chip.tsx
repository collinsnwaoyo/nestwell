import { cn } from "cn";
import type { RentStatus } from "@/lib/domain";

// PRD: "status in green, amber, red and purple used sparingly on chips only."
const STATUS_STYLES: Record<RentStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  due_soon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  due_today: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  notice: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  vacant: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<RentStatus, string> = {
  paid: "Paid",
  due_soon: "Due soon",
  due_today: "Due today",
  overdue: "Overdue",
  notice: "On notice",
  vacant: "Vacant",
};

export function StatusChip({ status, className }: { status: RentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
