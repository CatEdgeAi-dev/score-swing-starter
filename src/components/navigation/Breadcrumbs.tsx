import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    path?: string;
    icon?: React.ComponentType<any>;
  };
}

const breadcrumbConfig: BreadcrumbConfig = {
  '/': { label: 'Home', icon: Home },
  '/rounds': { label: 'Rounds', path: '/rounds' },
  '/scorecard': { label: 'Scorecard', path: '/scorecard' },
  '/history': { label: 'History', path: '/history' },
  '/performance': { label: 'Performance', path: '/performance' },
  '/profile': { label: 'Profile', path: '/profile' },
  '/community': { label: 'Community', path: '/community' },
  '/settings': { label: 'Settings', path: '/settings' },
};

const performanceTabLabels: Record<string, string> = {
  'stats': 'My Stats',
  'leaderboards': 'Leaderboards', 
  'achievements': 'Achievements',
  'challenges': 'Challenges'
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Don't show breadcrumbs on home/login pages
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems = [];
  
  // Always start with Home/Rounds
  breadcrumbItems.push({
    label: 'Rounds',
    path: '/rounds',
    isLast: false
  });

  // Add current page if it's not rounds
  if (location.pathname !== '/rounds') {
    const currentConfig = breadcrumbConfig[location.pathname];
    if (currentConfig) {
      breadcrumbItems.push({
        label: currentConfig.label,
        path: location.pathname,
        isLast: location.pathname !== '/performance'
      });
      
      // Add sub-section breadcrumb for performance tabs
      if (location.pathname === '/performance') {
        const activeTab = searchParams.get('tab') || 'stats';
        if (performanceTabLabels[activeTab]) {
          breadcrumbItems.push({
            label: performanceTabLabels[activeTab],
            path: `/performance?tab=${activeTab}`,
            isLast: true
          });
        }
      }
    }
  } else {
    if (breadcrumbItems.length > 0) {
      breadcrumbItems[0].isLast = true;
    }
  }

  return (
    <Breadcrumb className="px-4 py-2 bg-muted/30 border-b border-border">
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={item.path} className="flex items-center">
            {index > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="font-medium">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.path} className="hover:text-primary">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};