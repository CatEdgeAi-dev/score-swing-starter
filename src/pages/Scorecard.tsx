import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HoleInput } from '@/components/scorecard/HoleInput';
import { StatSummary } from '@/components/scorecard/StatSummary';
import { ScorecardProvider, useScorecardContext } from '@/components/scorecard/ScorecardContext';
import { SaveRoundDialog } from '@/components/scorecard/SaveRoundDialog';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRounds } from '@/hooks/useRounds';
import { Share2 } from 'lucide-react';

const ScorecardContent = () => {
  const { holes, getTotalScore, getAveragePutts, getGIRPercentage } = useScorecardContext();
  const { shareRound } = useRounds();

  const handleShare = async () => {
    // Create a temporary round for sharing
    const shareText = `🏌️ Golf Round Summary
⛳ Score: ${getTotalScore()} 
🏀 Avg Putts: ${getAveragePutts().toFixed(1)}
🎯 GIR: ${getGIRPercentage().toFixed(0)}%

Shared from Golf Scorecard App`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Golf Round Summary',
          text: shareText,
        });
      } catch (error) {
        // Fall back to clipboard
        await navigator.clipboard.writeText(shareText);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar title="Golf Scorecard" />
      
      <div className="flex-1 max-w-md mx-auto p-4 space-y-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-primary">Golf Scorecard</CardTitle>
            <p className="text-center text-muted-foreground">18-Hole Round</p>
          </CardHeader>
        </Card>

        <div className="space-y-3">
          {Array.from({ length: 18 }, (_, index) => (
            <HoleInput key={index + 1} holeNumber={index + 1} />
          ))}
        </div>

        <Separator className="my-6" />

        <StatSummary
          totalScore={getTotalScore()}
          averagePutts={getAveragePutts()}
          girPercentage={getGIRPercentage()}
        />

        <div className="space-y-3 pt-4">
          <SaveRoundDialog>
            <Button className="w-full min-h-[44px]">
              Save Round
            </Button>
          </SaveRoundDialog>
          <Button 
            variant="outline" 
            className="w-full min-h-[44px]" 
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Scorecard
          </Button>
        </div>
      </div>
      
      <BottomTabs />
    </div>
  );
};

const Scorecard = () => {
  return (
    <ProtectedRoute>
      <ScorecardProvider>
        <ScorecardContent />
      </ScorecardProvider>
    </ProtectedRoute>
  );
};

export default Scorecard;