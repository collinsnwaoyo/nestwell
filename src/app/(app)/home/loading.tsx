import { ListSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <PageSkeleton>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-7 w-28" />

      <div className="mt-8 flex flex-col gap-8">
        <div className="border-t border-border pt-6">
          <Skeleton className="mb-4 h-5 w-28" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} aria-hidden className="h-[9.5rem] animate-pulse rounded-lg bg-card" />
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-6">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} aria-hidden className="h-16 animate-pulse rounded-lg bg-card" />
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-6">
          <Skeleton className="mb-4 h-5 w-24" />
          <ListSkeleton rows={4} />
        </div>
      </div>
    </PageSkeleton>
  );
}
