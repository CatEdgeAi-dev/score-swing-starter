import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFlightContext } from '@/contexts/FlightContext';
import { useScorecardContext } from '@/components/scorecard/ScorecardContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';

interface RouteGuardProps {
  children: ReactNode;
  requiresRoundSetup?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiresRoundSetup = false 
}) => {
  const location = useLocation();
  const { isFlightMode, currentFlight, currentPlayer } = useFlightContext();
  
  // For scorecard route, check if round is properly set up
  if (requiresRoundSetup && location.pathname === '/scorecard') {
    // Check if this is a fresh navigation without proper setup
    const hasValidSetup = isFlightMode 
      ? (currentFlight && currentPlayer) 
      : true; // Solo rounds don't require special setup
    
    // Allow access if coming from rounds page or if setup is valid
    const fromRoundsPage = document.referrer.includes('/rounds') || 
                          sessionStorage.getItem('fromRounds') === 'true';
    
    if (!hasValidSetup && !fromRoundsPage) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <TopBar title="Setup Required" />
          
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center space-y-4">
                <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500" />
                <h2 className="text-xl font-semibold">Round Setup Required</h2>
                <p className="text-muted-foreground">
                  Please start a new round from the rounds page to access the scorecard.
                </p>
                <Button 
                  onClick={() => {
                    sessionStorage.removeItem('fromRounds');
                    window.location.href = '/rounds';
                  }}
                  className="w-full gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go to Rounds
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <BottomTabs />
        </div>
      );
    }
    
    // Clear the session storage flag after successful access
    if (fromRoundsPage) {
      sessionStorage.removeItem('fromRounds');
    }
  }

  return <>{children}</>;
};