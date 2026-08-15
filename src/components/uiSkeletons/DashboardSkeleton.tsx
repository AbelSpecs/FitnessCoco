import { AppShell } from "@/components/AppShell";
import { Skeleton } from "@/components/uiSkeletons/skeleton";

export function DashboardSkeleton() {
  return (
    <AppShell>
      <div className="space-y-8 animate-pulse p-4 sm:p-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-muted/60" />
            <Skeleton className="h-4 w-64 bg-muted/40" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl bg-muted/60" />
        </div>

        {/* Hero & Cards Skeleton Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-border/60 bg-card/40 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40 bg-muted/60" />
              <Skeleton className="h-6 w-24 rounded-full bg-muted/60" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-3/4 bg-muted/60" />
              <Skeleton className="h-4 w-1/2 bg-muted/40" />
            </div>
            <div className="pt-4 border-t border-border/40 flex items-center justify-between">
              <Skeleton className="h-10 w-32 rounded-xl bg-muted/60" />
              <Skeleton className="h-10 w-32 rounded-xl bg-muted/60" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-muted/60" />
                <Skeleton className="h-6 w-20 bg-muted/60" />
              </div>
              <Skeleton className="h-20 w-20 rounded-full bg-muted/60" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl bg-muted/60" />
          </div>
        </div>

        {/* Experience Bar Skeleton */}
        <div className="mt-12 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32 bg-muted/60" />
            <Skeleton className="h-4 w-16 bg-muted/60" />
          </div>
          <Skeleton className="h-3 w-full rounded-full bg-muted/60" />
        </div>

        {/* Routine Grid Skeleton */}
        <div className="space-y-4 pt-4">
          <Skeleton className="h-6 w-44 bg-muted/60" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl bg-muted/40" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default DashboardSkeleton;
