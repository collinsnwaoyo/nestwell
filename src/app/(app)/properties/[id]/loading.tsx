import { ListSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PropertyLoading() {
  return (
    <PageSkeleton>
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-52" />
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-10 flex-1 sm:w-36 sm:flex-none" />
        <Skeleton className="h-10 flex-1 sm:w-40 sm:flex-none" />
      </div>
      <Skeleton className="mt-8 mb-4 h-5 w-16" />
      <div className="flex flex-col gap-4">
        <ListSkeleton rows={2} />
        <ListSkeleton rows={1} />
      </div>
    </PageSkeleton>
  );
}
