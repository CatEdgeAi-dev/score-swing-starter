import { Suspense, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteLoadingWrapperProps {
  children: ReactNode;
  title?: string;
}

const RouteLoadingSkeleton: React.FC<{ title?: string }> = ({ title }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <TopBar title={title || 'Loading...'} />
    
    <div className="flex-1 p-4 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
    
    <BottomTabs />
  </div>
);

const getPageTitle = (pathname: string): string => {
  const titles: Record<string, string> = {
    '/rounds': 'Golf Rounds',
    '/scorecard': 'Scorecard',
    '/history': 'Round History',
    '/stats': 'Statistics',
    '/profile': 'Profile',
  };
  return titles[pathname] || 'Birdie Buddies';
};

export const RouteLoadingWrapper: React.FC<RouteLoadingWrapperProps> = ({ 
  children, 
  title 
}) => {
  const location = useLocation();
  const pageTitle = title || getPageTitle(location.pathname);

  return (
    <Suspense fallback={<RouteLoadingSkeleton title={pageTitle} />}>
      {children}
    </Suspense>
  );
};