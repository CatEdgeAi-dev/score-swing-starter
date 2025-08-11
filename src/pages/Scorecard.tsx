import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HoleInput } from '@/components/scorecard/HoleInput';
import { SinglePanelInput } from '@/components/scorecard/SinglePanelInput';
import { StatSummary } from '@/components/scorecard/StatSummary';
import { useScorecardContext } from '@/components/scorecard/ScorecardContext';
import { SaveRoundDialog } from '@/components/scorecard/SaveRoundDialog';
import { EnhancedHeader } from '@/components/scorecard/EnhancedHeader';
import { HoleNavigation } from '@/components/scorecard/HoleNavigation';
import { AdvancedHoleNavigation } from '@/components/scorecard/AdvancedHoleNavigation';
import { FloatingActionButtons } from '@/components/scorecard/FloatingActionButtons';
import { ConfirmationDialog } from '@/components/scorecard/ConfirmationDialog';
import { ScorecardSkeleton } from '@/components/scorecard/LoadingSpinner';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRounds } from '@/hooks/useRounds';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { FlightPlayerSelector } from '@/components/flight/FlightPlayerSelector';
import { useFlightContext } from '@/contexts/FlightContext';
import { useToast } from '@/hooks/use-toast';
import { Share2, ArrowLeft, Plus, Grid3X3, Focus } from 'lucide-react';
import { makeSafeHole } from '@/components/scorecard/hole-utils';

const ScorecardContent = () => {
  const navigate = useNavigate();
  const { holes, updateHole, resetScorecard, getTotalScore, getAveragePutts, getGIRPercentage } = useScorecardContext();
  const { shareRound } = useRounds();
  const { toast } = useToast();
  const { currentFlight, currentPlayer, switchToPlayer, isFlightMode } = useFlightContext();
  
  // Enhanced state management
  const [courseName, setCourseName] = useState(
    isFlightMode ? (currentFlight?.courseName || 'Local Golf Course') : 'Local Golf Course'
  );
  const [weather, setWeather] = useState(
    isFlightMode ? (currentFlight?.weather || 'sunny') : 'sunny'
  );
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetType, setResetType] = useState<'hole' | 'round'>('hole');
  const [showNewRoundDialog, setShowNewRoundDialog] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [inputMode, setInputMode] = useState<'focused' | 'panel'>('panel');

  // Current date
  const currentDate = isFlightMode 
    ? (currentFlight?.datePlayedInfo || new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }))
    : new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

  // Find holes with data for navigation indicators
  const holesWithData = useMemo(() => {
    const holesArray: number[] = [];
    for (let i = 1; i <= 18; i++) {
      const h = makeSafeHole(holes[i], i);
      if (h.strokes > 0 || h.putts > 0 || h.notes.trim() !== '') {
        holesArray.push(i);
      }
    }
    return holesArray;
  }, [holes]);
  // Find the furthest hole with data for progress
  const furthestHole = useMemo(() => {
    for (let i = 18; i >= 1; i--) {
      const h = makeSafeHole(holes[i], i);
      if (h.strokes > 0 || h.putts > 0 || h.notes.trim() !== '') {
        return i;
      }
    }
    return 1;
  }, [holes]);

  // Swipe gesture handlers
  const handleSwipeLeft = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
      toast({
        title: `Hole ${currentHole + 1}`,
        description: "Swipe right to go back",
        duration: 1000,
      });
    }
  };

  const handleSwipeRight = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
      toast({
        title: `Hole ${currentHole - 1}`,
        description: "Swipe left to continue",
        duration: 1000,
      });
    }
  };

  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    disabled: isLoading
  });

  // Quick action handlers
  const handleQuickStroke = (increment: boolean) => {
    const h = makeSafeHole(holes[currentHole], currentHole);
    const newStrokes = increment 
      ? h.strokes + 1 
      : Math.max(0, h.strokes - 1);
    
    updateHole(currentHole, { strokes: newStrokes });
    
    toast({
      title: increment ? "Stroke added" : "Stroke removed",
      description: `Hole ${currentHole}: ${newStrokes} strokes`,
      duration: 1000,
    });
  };

  const handleResetHole = () => {
    setResetType('hole');
    setShowResetDialog(true);
  };

  const handleResetRound = () => {
    setResetType('round');
    setShowResetDialog(true);
  };

  const handleNewRound = () => {
    setShowNewRoundDialog(true);
  };

  const handleBackNavigation = () => {
    // Check if there's any data in the scorecard
    const hasData = Array.from({ length: 18 }, (_, idx) => idx + 1).some((i) => {
      const h = makeSafeHole(holes[i], i);
      return h.strokes > 0 || h.putts > 0 || h.notes.trim() !== '';
    });
    
    if (hasData) {
      setShowBackDialog(true);
    } else {
      navigate('/rounds');
    }
  };

  const confirmBackNavigation = () => {
    setShowBackDialog(false);
    navigate('/rounds');
  };

  const toggleInputMode = () => {
    setInputMode(prev => prev === 'focused' ? 'panel' : 'focused');
  };

  const confirmNewRound = () => {
    resetScorecard();
    setCurrentHole(1);
    setCourseName('Local Golf Course');
    setWeather('sunny');
    setShowNewRoundDialog(false);
    toast({
      title: "New Round Started",
      description: "Previous round data has been cleared",
    });
  };

  const confirmReset = () => {
    if (resetType === 'hole') {
      updateHole(currentHole, {
        strokes: 0,
        putts: 0,
        fairwayHit: false,
        greenInRegulation: false,
        upAndDown: false,
        notes: ''
      });
      toast({
        title: "Hole reset",
        description: `Hole ${currentHole} has been cleared`,
      });
    } else {
      resetScorecard();
      setCurrentHole(1);
      toast({
        title: "Round reset",
        description: "All holes have been cleared",
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Round saved!",
        description: "Your scorecard has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Failed to save your round. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareText = `🏌️ Golf Round Summary
⛳ Course: ${courseName}
📅 Date: ${currentDate}
🌤️ Weather: ${weather}
${isFlightMode ? `👥 Flight: ${currentFlight?.name}\n🏌️ Player: ${currentPlayer?.name}\n` : ''}🏆 Score: ${getTotalScore()} 
🏀 Avg Putts: ${getAveragePutts().toFixed(1)}
🎯 GIR: ${getGIRPercentage().toFixed(0)}%

Shared from Birdie Buddies App`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Golf Round Summary',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Round summary copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Share failed",
        description: "Failed to share your round",
      });
    }
  };

  // Direct hole selection
  const handleHoleSelect = (hole: number) => {
    setCurrentHole(hole);
    toast({
      title: `Hole ${hole}`,
      description: "Jumped to selected hole",
      duration: 1000,
    });
  };
  
  // Navigation handlers
  const handlePrevHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  const handleNextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  if (isLoading) {
    return <ScorecardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" {...swipeHandlers}>
      {/* Custom TopBar with back navigation */}
      <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackNavigation}
            className="p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Birdie Buddies</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleInputMode}
            className="flex items-center space-x-1"
          >
            {inputMode === 'focused' ? (
              <>
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Panel</span>
              </>
            ) : (
              <>
                <Focus className="h-4 w-4" />
                <span className="hidden sm:inline">Focus</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewRound}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Round</span>
          </Button>
        </div>
      </div>
      
        <div className="flex-1 max-w-md mx-auto p-4 space-y-4 pb-24">
          {/* Flight Player Selector - only show in flight mode */}
          {isFlightMode && currentFlight && currentPlayer && (
            <FlightPlayerSelector
              players={currentFlight.players}
              currentPlayer={currentPlayer}
              onPlayerSwitch={switchToPlayer}
              flightName={currentFlight.name}
              className="mb-4"
            />
          )}

          <EnhancedHeader
          courseName={courseName}
          date={currentDate}
          weather={weather}
          currentHole={Math.max(currentHole, furthestHole)}
          totalHoles={18}
          onCourseNameChange={setCourseName}
          onWeatherChange={setWeather}
          onNewRound={handleNewRound}
        />

        {/* Conditional rendering based on input mode */}
        {inputMode === 'focused' ? (
          <>
            <AdvancedHoleNavigation
              currentHole={currentHole}
              totalHoles={18}
              onHoleSelect={handleHoleSelect}
              onPrevious={handlePrevHole}
              onNext={handleNextHole}
              holesWithData={holesWithData}
              className="mb-4"
            />

            {/* Current Hole Display */}
            <HoleInput holeNumber={currentHole} />
          </>
        ) : (
          /* Single Panel Input Mode */
          <div className="animate-fade-in">
            <SinglePanelInput />
          </div>
        )}

        <Separator className="my-6" />

        <StatSummary
          totalScore={getTotalScore()}
          averagePutts={getAveragePutts()}
          girPercentage={getGIRPercentage()}
        />

        <div className="space-y-3 pt-4">
          <SaveRoundDialog>
            <Button className="w-full min-h-[44px]" disabled={isLoading}>
              Save Round
            </Button>
          </SaveRoundDialog>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="min-h-[44px]" 
              onClick={handleShare}
              disabled={isLoading}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button 
              variant="outline" 
              className="min-h-[44px]" 
              onClick={handleResetRound}
              disabled={isLoading}
            >
              Reset Round
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onQuickStroke={handleQuickStroke}
        onReset={handleResetHole}
        onSave={handleSave}
        onShare={handleShare}
        onPrevHole={handlePrevHole}
        onNextHole={handleNextHole}
        canGoPrev={currentHole > 1}
        canGoNext={currentHole < 18}
        currentHole={currentHole}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title={resetType === 'hole' ? 'Reset Current Hole?' : 'Reset Entire Round?'}
        description={
          resetType === 'hole' 
            ? `This will clear all data for hole ${currentHole}. This action cannot be undone.`
            : 'This will clear all data for the entire round. This action cannot be undone.'
        }
        confirmLabel="Reset"
        onConfirm={confirmReset}
        variant="destructive"
      />

      {/* New Round Confirmation Dialog */}
      <ConfirmationDialog
        open={showNewRoundDialog}
        onOpenChange={setShowNewRoundDialog}
        title="Start New Round?"
        description="This will clear all current round data and start fresh. Make sure to save your current round first if you want to keep it."
        confirmLabel="Start New Round"
        variant="destructive"
        onConfirm={confirmNewRound}
      />

      {/* Back Navigation Confirmation Dialog */}
      <ConfirmationDialog
        open={showBackDialog}
        onOpenChange={setShowBackDialog}
        title="Leave Scorecard?"
        description="You have unsaved data. Are you sure you want to leave? Your current round data will be lost."
        confirmLabel="Leave"
        variant="destructive"
        onConfirm={confirmBackNavigation}
      />
      <BottomTabs />
    </div>
  );
};

const Scorecard = () => {
  return (
    <ProtectedRoute>
      <ScorecardContent />
    </ProtectedRoute>
  );
};

export default Scorecard;