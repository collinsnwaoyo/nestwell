import { ListSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <PageSkeleton>
      <div className="mb-8 flex items-end justify-between gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <ListSkeleton rows={4} />
    </PageSkeleton>
  );
}
