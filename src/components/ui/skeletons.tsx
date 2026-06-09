import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-card-soft">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-1 pt-1">
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-24 mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-8 text-center">
      <Skeleton className="h-5 w-24 mx-auto" />
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="container-page py-10">
      <div className="grid lg:grid-cols-2 gap-10">
        <Skeleton className="aspect-[3/4] max-h-[500px] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-48" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-12 w-full mt-4" />
        </div>
      </div>
    </div>
  );
}
