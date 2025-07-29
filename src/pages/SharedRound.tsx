import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Share2, 
  Calendar, 
  MapPin, 
  Trophy,
  Target,
  TrendingUp,
  ArrowLeft,
  Download,
  Users,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRounds } from '@/hooks/useRounds';
import { LoadingSpinner } from '@/components/scorecard/LoadingSpinner';

interface SharedRoundData {
  id: string;
  course_name: string;
  date_played: string;
  total_score: number;
  total_putts: number;
  fairways_hit: number;
  greens_in_regulation: number;
  player_name: string;
  flight_name?: string;
  is_flight_round: boolean;
  holes: Array<{
    hole_number: number;
    par: number;
    strokes: number;
    putts: number;
    fairway_hit: boolean;
    green_in_regulation: boolean;
    notes?: string;
  }>;
}

const SharedRound = () => {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchRoundDetails } = useRounds();
  
  const [roundData, setRoundData] = useState<SharedRoundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedRound = async () => {
      if (!roundId) {
        setError('No round ID provided');
        setLoading(false);
        return;
      }

      try {
        // Try to fetch the round details
        const round = await fetchRoundDetails(roundId);
        
        if (!round) {
          setError('Round not found or access denied');
          setLoading(false);
          return;
        }

        // Transform the data for display
        const sharedData: SharedRoundData = {
          id: round.id,
          course_name: round.course_name || 'Golf Course',
          date_played: round.date_played,
          total_score: round.total_score,
          total_putts: round.total_putts,
          fairways_hit: round.fairways_hit,
          greens_in_regulation: round.greens_in_regulation,
          player_name: round.profiles?.display_name || 'Unknown Player',
          flight_name: round.flight_name,
          is_flight_round: round.is_flight_round || false,
          holes: round.holes?.map((hole: any) => ({
            hole_number: hole.hole_number,
            par: hole.par,
            strokes: hole.strokes,
            putts: hole.putts,
            fairway_hit: hole.fairway_hit,
            green_in_regulation: hole.green_in_regulation,
            notes: hole.notes
          })) || []
        };

        setRoundData(sharedData);
      } catch (err: any) {
        console.error('Error loading shared round:', err);
        setError('Failed to load round data');
      } finally {
        setLoading(false);
      }
    };

    loadSharedRound();
  }, [roundId, fetchRoundDetails]);

  const handleShare = async () => {
    if (!roundData) return;

    const scoreVsPar = roundData.total_score - 72;
    const scoreText = scoreVsPar === 0 ? 'Even par' : scoreVsPar > 0 ? `+${scoreVsPar}` : `${scoreVsPar}`;
    
    const shareText = `🏌️ Golf Round Summary
📍 ${roundData.course_name}
📅 ${new Date(roundData.date_played).toLocaleDateString()}
👤 ${roundData.player_name}${roundData.is_flight_round ? ` (${roundData.flight_name})` : ''}
⛳ Score: ${roundData.total_score} (${scoreText})
🏀 Putts: ${roundData.total_putts}
🎯 GIR: ${roundData.greens_in_regulation}/18
🎪 Fairways: ${roundData.fairways_hit}/14

View full details: ${window.location.href}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Golf Round Summary',
          text: shareText,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Round summary copied to clipboard.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Share failed",
        description: "Failed to share round summary.",
      });
    }
  };

  const handleJoinApp = () => {
    if (user) {
      navigate('/rounds');
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !roundData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold">Round Not Found</h2>
            <p className="text-muted-foreground">
              {error || 'This round may be private or no longer exist.'}
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreVsPar = roundData.total_score - 72;
  const scoreStatus = scoreVsPar < 0 ? 'Under Par' : scoreVsPar === 0 ? 'Even Par' : 'Over Par';
  const scoreColor = scoreVsPar < 0 ? 'text-green-600' : scoreVsPar === 0 ? 'text-blue-600' : 'text-orange-600';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Shared Round</h1>
        </div>
        
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 pb-8">
        {/* Round Header */}
        <Card>
          <CardHeader className="text-center space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-xl">{roundData.course_name}</CardTitle>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(roundData.date_played).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {roundData.is_flight_round ? (
                    <Users className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span>{roundData.player_name}</span>
                </div>
              </div>

              {roundData.is_flight_round && roundData.flight_name && (
                <Badge variant="outline" className="text-xs">
                  Flight: {roundData.flight_name}
                </Badge>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-1">
                {roundData.total_score}
              </div>
              <div className={`text-sm font-medium ${scoreColor}`}>
                {scoreStatus} ({scoreVsPar > 0 ? '+' : ''}{scoreVsPar})
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Round Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Round Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{roundData.total_putts}</div>
                <div className="text-xs text-muted-foreground">Total Putts</div>
                <div className="text-xs text-muted-foreground">
                  ({(roundData.total_putts / 18).toFixed(1)} avg)
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{roundData.greens_in_regulation}</div>
                <div className="text-xs text-muted-foreground">GIR</div>
                <div className="text-xs text-muted-foreground">
                  ({Math.round((roundData.greens_in_regulation / 18) * 100)}%)
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">{roundData.fairways_hit}</div>
                <div className="text-xs text-muted-foreground">Fairways</div>
                <div className="text-xs text-muted-foreground">
                  ({Math.round((roundData.fairways_hit / 14) * 100)}%)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hole-by-Hole Details */}
        {roundData.holes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hole Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roundData.holes
                  .sort((a, b) => a.hole_number - b.hole_number)
                  .map((hole) => (
                    <div key={hole.hole_number} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {hole.hole_number}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Par {hole.par}</span>
                          {hole.notes && (
                            <div className="text-xs text-muted-foreground truncate max-w-20">
                              {hole.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold">{hole.strokes}</div>
                          <div className="text-xs text-muted-foreground">strokes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold">{hole.putts}</div>
                          <div className="text-xs text-muted-foreground">putts</div>
                        </div>
                        <div className="flex space-x-1">
                          {hole.fairway_hit && hole.par > 3 && (
                            <Badge variant="secondary" className="text-xs px-1">F</Badge>
                          )}
                          {hole.green_in_regulation && (
                            <Badge variant="secondary" className="text-xs px-1">G</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Track Your Own Rounds</h3>
              <p className="text-sm text-muted-foreground">
                Join Golf Scorecard to track your games, play with friends, and improve your performance.
              </p>
            </div>
            
            <Button onClick={handleJoinApp} className="w-full gap-2">
              <Target className="h-4 w-4" />
              {user ? 'Go to App' : 'Start Tracking'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedRound;