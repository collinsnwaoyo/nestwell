import { ListSkeleton, PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PropertiesLoading() {
  return (
    <PageSkeleton>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="mt-6">
        <ListSkeleton rows={4} />
      </div>
    </PageSkeleton>
  );
}
