import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScrollText, BarChart3, History, User } from 'lucide-react';

const tabs = [
  { id: 'scorecard', label: 'Scorecard', icon: ScrollText, path: '/scorecard' },
  { id: 'stats', label: 'Stats', icon: BarChart3, path: '/stats' },
  { id: 'history', label: 'History', icon: History, path: '/history' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export const BottomTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-background border-t border-border px-2 py-2 flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={20} />
            <span className="text-xs">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};