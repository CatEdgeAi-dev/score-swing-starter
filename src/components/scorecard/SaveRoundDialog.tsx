import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PostRoundStats } from './PostRoundStats';
import { useRounds } from '@/hooks/useRounds';
import { useScorecardContext } from './ScorecardContext';
import { useFlightContext } from '@/contexts/FlightContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface SaveRoundDialogProps {
  children: React.ReactNode;
}

export const SaveRoundDialog: React.FC<SaveRoundDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [courseName, setCourseName] = useState('');
  const { holes, resetScorecard, getTotalScore, getAveragePutts, getGIRPercentage, getFairwayPercentage } = useScorecardContext();
  const { currentFlight, currentPlayer, isFlightMode } = useFlightContext();
  const { saveRound, loading } = useRounds();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSave = async () => {
    const flightId = isFlightMode && currentFlight ? currentFlight.id : undefined;
    const playerId = isFlightMode && currentPlayer ? currentPlayer.id : undefined;
    
    const savedRound = await saveRound(
      holes, 
      courseName || undefined, 
      flightId, 
      playerId
    );
    
    if (savedRound) {
      setShowStats(true); // Show stats instead of closing immediately
    }
  };

  const handleShare = async () => {
    const shareText = `🏌️ Round Complete!
⛳ Course: ${courseName || 'Golf Course'}
${isFlightMode ? `👥 Flight: ${currentFlight?.name}\n🏌️ Player: ${currentPlayer?.name}\n` : ''}🏆 Score: ${getTotalScore()}
🏀 Avg Putts: ${getAveragePutts().toFixed(1)}
🎯 GIR: ${getGIRPercentage().toFixed(0)}%

Shared from Golf Scorecard App`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Golf Round Complete', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Copied to clipboard!", description: "Round summary copied" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Share failed" });
    }
  };

  const handleNewRound = () => {
    resetScorecard();
    setOpen(false);
    setShowStats(false);
    setCourseName('');
    navigate('/rounds');
  };

  const handleGoHome = () => {
    setOpen(false);
    setShowStats(false);
    setCourseName('');
    navigate('/rounds');
  };

  const hasScores = Object.values(holes).some(hole => hole.strokes > 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setShowStats(false);
        setCourseName('');
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!showStats ? (
          <>
            <DialogHeader>
              <DialogTitle>Save Golf Round</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">Course Name (Optional)</Label>
                <Input
                  id="course-name"
                  placeholder="Enter course name..."
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={!hasScores || loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Round
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
              {!hasScores && (
                <p className="text-sm text-muted-foreground">
                  Enter at least one score to save your round.
                </p>
              )}
            </div>
          </>
        ) : (
          <PostRoundStats
            totalScore={getTotalScore()}
            totalPutts={Object.values(holes).reduce((sum, hole) => sum + hole.putts, 0)}
            averagePutts={getAveragePutts()}
            girPercentage={getGIRPercentage()}
            fairwayPercentage={getFairwayPercentage()}
            courseName={courseName || 'Golf Course'}
            playerName={isFlightMode ? currentPlayer?.name : undefined}
            onShare={handleShare}
            onNewRound={handleNewRound}
            onGoHome={handleGoHome}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};