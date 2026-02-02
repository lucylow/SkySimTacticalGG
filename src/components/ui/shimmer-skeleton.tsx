import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
}

export const ShimmerSkeleton = ({ className }: ShimmerSkeletonProps) => (
  <div className={cn("shimmer-skeleton rounded-md", className)} />
);

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <ShimmerSkeleton className="h-8 w-64 mb-2" />
          <ShimmerSkeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-3">
          <ShimmerSkeleton className="h-10 w-24 rounded-lg" />
          <ShimmerSkeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <ShimmerSkeleton className="h-4 w-24" />
              <ShimmerSkeleton className="h-10 w-10 rounded-xl" />
            </div>
            <ShimmerSkeleton className="h-8 w-20 mb-2" />
            <ShimmerSkeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Skeleton */}
        <div className="lg:col-span-2 glass-card p-6">
          <ShimmerSkeleton className="h-6 w-40 mb-6" />
          <ShimmerSkeleton className="h-64 w-full rounded-xl" />
        </div>

        {/* Roster Skeleton */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <ShimmerSkeleton className="h-6 w-28" />
            <ShimmerSkeleton className="h-8 w-20 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <ShimmerSkeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <ShimmerSkeleton className="h-4 w-24 mb-2" />
                  <ShimmerSkeleton className="h-3 w-16" />
                </div>
                <ShimmerSkeleton className="h-6 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights Skeleton */}
      <div className="glass-card p-6">
        <ShimmerSkeleton className="h-6 w-56 mb-2" />
        <ShimmerSkeleton className="h-4 w-40 mb-6" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/30">
              <div className="flex items-start gap-3">
                <ShimmerSkeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <ShimmerSkeleton className="h-5 w-32 mb-2" />
                  <ShimmerSkeleton className="h-4 w-full mb-1" />
                  <ShimmerSkeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MatchAnalysisSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ShimmerSkeleton className="h-10 w-80" />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="glass-card p-4">
            <ShimmerSkeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="glass-card p-4">
            <ShimmerSkeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
        
        <div className="lg:col-span-2 glass-card p-4">
          <ShimmerSkeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const MotionViewerSkeleton = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Controls Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShimmerSkeleton className="h-9 w-9 rounded-lg" />
            <ShimmerSkeleton className="h-9 w-9 rounded-lg" />
            <ShimmerSkeleton className="h-9 w-9 rounded-lg" />
          </div>
          <ShimmerSkeleton className="h-6 w-32" />
        </div>
        <ShimmerSkeleton className="h-2 w-full rounded-full" />
      </div>

      {/* 3D Viewport */}
      <div className="glass-card p-4">
        <ShimmerSkeleton className="h-[500px] w-full rounded-xl" />
      </div>

      {/* Timeline */}
      <div className="glass-card p-4">
        <ShimmerSkeleton className="h-16 w-full rounded-lg" />
      </div>
    </div>
  );
};

export const PlayerCardSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 animate-in fade-in duration-300">
      <ShimmerSkeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <ShimmerSkeleton className="h-4 w-24 mb-2" />
        <ShimmerSkeleton className="h-3 w-16" />
      </div>
      <ShimmerSkeleton className="h-6 w-12 rounded-full" />
    </div>
  );
};
