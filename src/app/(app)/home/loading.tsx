import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

const CARD = "rounded-lg border border-border bg-surface shadow-1";

export default function HomeLoading() {
  return (
    <PageSkeleton>
      <div className="mb-8 flex items-end justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <div className={`${CARD} p-5`}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-8 w-48" />
            <Skeleton className="mt-5 h-[120px] w-full" />
          </div>
          <div className={`${CARD} grid gap-4 p-5 sm:grid-cols-3`}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-36" />
          <div className={`${CARD} flex flex-col gap-4 p-4`}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
