import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  User, 
  Crown, 
  Calendar,
  MapPin,
  Settings,
  BarChart3,
  Trophy,
  Award,
  Target
} from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useAuth } from '@/contexts/AuthContext';

interface ContextualHeaderProps {
  title?: string;
}

export const ContextualHeader: React.FC<ContextualHeaderProps> = ({ title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isFlightMode, currentFlight, currentPlayer } = useFlightContext();

  // Don't show on certain pages
  if (['/login', '/', '/profile'].includes(location.pathname)) {
    return null;
  }

  // Show flight context if in flight mode
  if (isFlightMode && currentFlight && currentPlayer) {
    const isCreator = currentFlight.createdBy === user?.id;
    
    return (
      <Card className="mx-4 mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">{currentFlight.name}</span>
              {isCreator && (
                <Badge variant="default" className="text-xs gap-1">
                  <Crown className="h-2 w-2" />
                  Host
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{currentFlight.courseName || 'Golf Course'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Playing as: <span className="font-medium text-primary">{currentPlayer.name}</span>
              </span>
              <Badge variant="secondary" className="text-xs">
                {currentFlight.players.findIndex(p => p.id === currentPlayer.id) + 1} of {currentFlight.players.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show solo mode indicator
  if (location.pathname === '/scorecard') {
    return (
      <Card className="mx-4 mb-4 border-secondary/20 bg-secondary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-secondary-foreground" />
            <span className="text-sm font-medium">Solo Round</span>
            <Badge variant="outline" className="text-xs">
              Individual Play
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show performance section navigation
  if (location.pathname === '/performance') {
    const activeTab = searchParams.get('tab') || 'stats';
    const quickActions = [
      { label: 'My Stats', tab: 'stats', icon: BarChart3 },
      { label: 'Leaderboards', tab: 'leaderboards', icon: Trophy },
      { label: 'Achievements', tab: 'achievements', icon: Award },
      { label: 'Challenges', tab: 'challenges', icon: Target }
    ];

    return (
      <Card className="mx-4 mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">Performance Hub</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isActive = activeTab === action.tab;
              
              return (
                <Button
                  key={action.tab}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="justify-start gap-2 h-8"
                  onClick={() => navigate(`/performance?tab=${action.tab}`)}
                >
                  <Icon className="h-3 w-3" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};