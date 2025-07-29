import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlightCreation } from '@/components/flight/FlightCreation';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useFlightContext } from '@/contexts/FlightContext';
import { 
  User, 
  Users, 
  Play, 
  History,
  Trophy,
  TrendingUp,
  Calendar
} from 'lucide-react';

const RoundSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createFlight } = useFlightContext();

  const handleSoloRound = () => {
    navigate('/scorecard');
  };

  const handleCreateFlight = (flightData: {
    name: string;
    courseName: string;
    players: any[];
  }) => {
    createFlight(flightData);
    navigate('/scorecard');
  };

  const getUserName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Player';
  };

  const currentUser = {
    id: user?.id || '',
    name: getUserName(),
    email: user?.email
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar title="Golf Scorecard" />
        
        <div className="flex-1 max-w-md mx-auto p-4 space-y-6 pb-20">
          {/* Welcome Section */}
          <div className="text-center space-y-2 py-4">
            <h1 className="text-2xl font-bold text-primary">Ready to Play?</h1>
            <p className="text-muted-foreground">
              Start a solo round or create a flight with friends
            </p>
          </div>

          {/* Play Options */}
          <div className="space-y-4">
            {/* Solo Round */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20">
              <CardContent className="p-6" onClick={handleSoloRound}>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Solo Round</h3>
                    <p className="text-sm text-muted-foreground">
                      Track your individual scorecard
                    </p>
                  </div>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Flight Creation */}
            <FlightCreation
              onCreateFlight={handleCreateFlight}
              currentUser={currentUser}
            />
          </div>

          {/* Quick Stats Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Rounds Played</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold">--</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                <History className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No rounds played yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start your first round to see your activity here
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features Info */}
          <div className="space-y-3 pt-4">
            <h2 className="text-lg font-semibold">Features</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full" />
                <span>Track detailed hole-by-hole statistics</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full" />
                <span>Play with friends in flights (up to 4 players)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full" />
                <span>View round history and performance trends</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full" />
                <span>Guest players can upgrade to full accounts</span>
              </div>
            </div>
          </div>
        </div>
        
        <BottomTabs />
      </div>
    </ProtectedRoute>
  );
};

export default RoundSelection;