import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => {
  return (
    <div className={className}>
      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
    </div>
  );
};

interface ScorecardSkeletonProps {
  holes?: number;
}

export const ScorecardSkeleton: React.FC<ScorecardSkeletonProps> = ({ holes = 18 }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <div className="bg-background border-b border-border px-4 py-3">
        <Skeleton className="h-6 w-32" />
      </div>
      
      <div className="flex-1 max-w-md mx-auto p-4 space-y-4 pb-20">
        {/* Enhanced Header Skeleton */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>

        {/* Title Card Skeleton */}
        <div className="border rounded-lg p-4 space-y-2">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>

        {/* Hole Input Skeletons */}
        <div className="space-y-3">
          {Array.from({ length: holes }, (_, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Summary Skeleton */}
        <div className="border rounded-lg p-4 space-y-4">
          <Skeleton className="h-6 w-32 mx-auto" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
      
      {/* Bottom Navigation Skeleton */}
      <div className="border-t border-border bg-background">
        <div className="flex justify-around py-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-12 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
};