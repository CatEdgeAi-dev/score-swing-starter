import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  User, 
  Users, 
  Play,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useFlightContext } from '@/contexts/FlightContext';
import { useScorecardContext } from '@/components/scorecard/ScorecardContext';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  
  const { isFlightMode, currentFlight, leaveFlight } = useFlightContext();
  const { holes, resetScorecard } = useScorecardContext();

  // Don't show on login or loading pages
  if (location.pathname === '/login' || location.pathname === '/') {
    return null;
  }

  const hasUnsavedData = Object.values(holes).some(hole => hole.strokes > 0 || hole.putts > 0);
  
  const handleActionWithConfirmation = (action: () => void, requiresConfirmation = true) => {
    if (requiresConfirmation && hasUnsavedData && location.pathname === '/scorecard') {
      setPendingAction(() => action);
      setShowConfirmDialog(true);
    } else {
      action();
    }
  };

  const handleSoloRound = () => {
    if (isFlightMode) {
      leaveFlight();
    }
    sessionStorage.setItem('fromRounds', 'true');
    if (location.pathname === '/scorecard') {
      resetScorecard();
      toast({
        title: "New Solo Round Started",
        description: "Previous round data has been cleared",
      });
    } else {
      navigate('/scorecard');
    }
  };

  const handleFlightRound = () => {
    sessionStorage.setItem('fromRounds', 'true');
    navigate('/rounds');
  };

  const handleNewRound = () => {
    if (location.pathname === '/scorecard') {
      resetScorecard();
      toast({
        title: "New Round Started",
        description: "Previous round data has been cleared",
      });
    } else {
      navigate('/rounds');
    }
  };

  const confirmPendingAction = () => {
    pendingAction();
    setShowConfirmDialog(false);
  };

  return (
    <>
      <div className="fixed bottom-20 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
            >
              <Zap className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleActionWithConfirmation(handleSoloRound)}>
              <User className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Quick Solo Round</span>
                <span className="text-xs text-muted-foreground">Start immediately</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleActionWithConfirmation(handleFlightRound, false)}>
              <Users className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>Create Flight</span>
                <span className="text-xs text-muted-foreground">Play with friends</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {location.pathname === '/scorecard' && (
              <DropdownMenuItem onClick={() => handleActionWithConfirmation(handleNewRound)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>New Round</span>
                  <span className="text-xs text-muted-foreground">Reset current scorecard</span>
                </div>
              </DropdownMenuItem>
            )}
            
            {location.pathname !== '/rounds' && (
              <DropdownMenuItem onClick={() => handleActionWithConfirmation(() => navigate('/rounds'), false)}>
                <Play className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Round Selection</span>
                  <span className="text-xs text-muted-foreground">Go to rounds page</span>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Unsaved Round Data"
        description="You have unsaved round data. Are you sure you want to continue? This action cannot be undone."
        confirmLabel="Continue"
        cancelLabel="Stay"
        variant="destructive"
        onConfirm={confirmPendingAction}
      />
    </>
  );
};