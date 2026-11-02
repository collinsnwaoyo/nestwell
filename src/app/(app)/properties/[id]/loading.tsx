import { ListSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PropertyLoading() {
  return (
    <PageSkeleton>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-10">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-16" />
          <ListSkeleton rows={3} />
          <ListSkeleton rows={2} />
        </div>
        <div className="hidden flex-col gap-3 lg:flex">
          <Skeleton className="h-5 w-24" />
          <ListSkeleton rows={3} />
        </div>
      </div>
    </PageSkeleton>
  );
}
