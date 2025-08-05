import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScrollText, BarChart3, History, User, Play, Users } from 'lucide-react';

const tabs = [
  { id: 'rounds', label: 'Rounds', icon: Play, path: '/rounds' },
  { id: 'scorecard', label: 'Scorecard', icon: ScrollText, path: '/scorecard' },
  { id: 'community', label: 'Community', icon: Users, path: '/community' },
  { id: 'performance', label: 'Performance', icon: BarChart3, path: '/stats' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export const BottomTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-2 py-2 flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all duration-200 ${
              isActive 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={20} className={isActive ? 'scale-110' : ''} />
            <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>
              {tab.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
};