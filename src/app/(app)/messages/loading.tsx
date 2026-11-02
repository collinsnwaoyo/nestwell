import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <PageSkeleton>
      <div className="mb-8 flex items-end justify-between gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-1">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full max-w-[60ch]" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
