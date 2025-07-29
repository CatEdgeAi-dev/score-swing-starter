import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoundHistoryList } from '@/components/history/RoundHistoryList';
import { RoundDetailModal } from '@/components/history/RoundDetailModal';
import { TopBar } from '@/components/navigation/TopBar';
import { BottomTabs } from '@/components/navigation/BottomTabs';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRounds } from '@/hooks/useRounds';
import { 
  History, 
  Trophy, 
  TrendingUp,
  Calendar,
  Target,
  Plus
} from 'lucide-react';

interface ProcessedRound {
  id: string;
  courseName: string;
  datePlayedInfo: string;
  totalScore: number;
  totalPutts: number;
  averagePutts: number;
  girPercentage: number;
  fairwayPercentage: number;
  flightName?: string;
  playerName?: string;
  isFlightRound: boolean;
  holes?: any[];
}

const RoundHistory = () => {
  const navigate = useNavigate();
  const { fetchRounds, fetchRoundDetails, loading } = useRounds();
  const [rounds, setRounds] = useState<ProcessedRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    const fetchedRounds = await fetchRounds();
    const processedRounds = fetchedRounds.map(round => ({
      id: round.id,
      courseName: round.course_name || 'Golf Course',
      datePlayedInfo: new Date(round.date_played).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      totalScore: round.total_score,
      totalPutts: round.total_putts,
      averagePutts: round.total_putts / 18,
      girPercentage: (round.greens_in_regulation / 18) * 100,
      fairwayPercentage: (round.fairways_hit / 14) * 100, // Assuming 14 driving holes
      isFlightRound: false, // Will be updated when we implement flight support
      holes: (round as any).holes
    }));
    
    setRounds(processedRounds);
    setStatsLoading(false);
  };

  const handleViewDetails = async (round: ProcessedRound) => {
    const roundDetails = await fetchRoundDetails(round.id);
    if (roundDetails) {
      // Process hole data for the modal
      const processedDetails = {
        ...round,
        holes: roundDetails.holes.map((hole: any) => ({
          hole: hole.hole_number,
          par: hole.par,
          strokes: hole.strokes,
          putts: hole.putts,
          fairwayHit: hole.fairway_hit,
          greenInRegulation: hole.green_in_regulation,
          upAndDown: hole.up_and_down,
          notes: hole.notes || ''
        }))
      };
      setSelectedRound(processedDetails);
      setShowDetailModal(true);
    }
  };

  const getOverallStats = () => {
    if (rounds.length === 0) return null;
    
    const totalRounds = rounds.length;
    const averageScore = rounds.reduce((sum, round) => sum + round.totalScore, 0) / totalRounds;
    const bestScore = Math.min(...rounds.map(round => round.totalScore));
    const averageGIR = rounds.reduce((sum, round) => sum + round.girPercentage, 0) / totalRounds;
    
    return {
      totalRounds,
      averageScore: averageScore.toFixed(1),
      bestScore,
      averageGIR: averageGIR.toFixed(0)
    };
  };

  const stats = getOverallStats();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar title="Round History" />
        
        <div className="flex-1 max-w-md mx-auto p-4 space-y-6 pb-20">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <History className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Round History</h1>
            </div>
            <p className="text-muted-foreground">
              Track your progress and review past rounds
            </p>
          </div>

          {/* Overall Stats */}
          {stats && !statsLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Overall Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-primary">{stats.totalRounds}</div>
                    <div className="text-xs text-muted-foreground">Rounds Played</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-primary">{stats.averageScore}</div>
                    <div className="text-xs text-muted-foreground">Average Score</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-green-600">{stats.bestScore}</div>
                    <div className="text-xs text-muted-foreground">Best Score</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-blue-600">{stats.averageGIR}%</div>
                    <div className="text-xs text-muted-foreground">Avg GIR</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Trends */}
          {rounds.length >= 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Recent Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    const recentRounds = rounds.slice(0, 3);
                    const trend = recentRounds[0].totalScore - recentRounds[2].totalScore;
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span>Last 3 rounds trend:</span>
                          <Badge variant={trend < 0 ? "default" : trend > 0 ? "destructive" : "secondary"}>
                            {trend < 0 ? `Improving by ${Math.abs(trend)} strokes` :
                             trend > 0 ? `Up by ${trend} strokes` :
                             'Consistent performance'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Recent scores: {recentRounds.map(r => r.totalScore).join(', ')}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Round History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Rounds</h2>
              <Button 
                size="sm" 
                onClick={() => navigate('/rounds')}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>New Round</span>
              </Button>
            </div>

            <RoundHistoryList
              rounds={rounds}
              loading={loading || statsLoading}
              onViewDetails={handleViewDetails}
            />
          </div>

          {/* Quick Actions */}
          {rounds.length === 0 && !loading && !statsLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No rounds yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start playing to build your round history and track your progress
                </p>
                <div className="space-y-2">
                  <Button onClick={() => navigate('/rounds')} className="w-full">
                    <Target className="h-4 w-4 mr-2" />
                    Start Your First Round
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Round Detail Modal */}
        <RoundDetailModal
          round={selectedRound}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
        
        <BottomTabs />
      </div>
    </ProtectedRoute>
  );
};

export default RoundHistory;