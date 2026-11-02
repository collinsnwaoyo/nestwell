import { ListSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <PageSkeleton>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="mt-6">
        <ListSkeleton rows={6} />
      </div>
    </PageSkeleton>
  );
}
