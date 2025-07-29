import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScorecardContext } from '@/components/scorecard/ScorecardContext';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export const useNavigationGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { holes } = useScorecardContext();
  
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const hasUnsavedData = Object.values(holes).some(hole => hole.strokes > 0 || hole.putts > 0);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData && location.pathname === '/scorecard') {
        e.preventDefault();
        e.returnValue = 'You have unsaved round data. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedData, location.pathname]);

  const guardedNavigate = (to: string) => {
    if (hasUnsavedData && location.pathname === '/scorecard') {
      setPendingNavigation(to);
      setShowLeaveDialog(true);
    } else {
      navigate(to);
    }
  };

  const confirmLeave = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    setShowLeaveDialog(false);
  };

  const NavigationGuardDialog = () => (
    <ConfirmationDialog
      open={showLeaveDialog}
      onOpenChange={setShowLeaveDialog}
      title="Leave Scorecard?"
      description="You have unsaved round data. Are you sure you want to leave? Your progress will be lost."
      confirmLabel="Leave"
      cancelLabel="Stay"
      variant="destructive"
      onConfirm={confirmLeave}
    />
  );

  return {
    guardedNavigate,
    hasUnsavedData,
    NavigationGuardDialog
  };
};