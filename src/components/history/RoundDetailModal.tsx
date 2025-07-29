import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar,
  MapPin,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  User,
  Target,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HoleData {
  hole: number;
  par: number;
  strokes: number;
  putts: number;
  fairwayHit: boolean;
  greenInRegulation: boolean;
  upAndDown: boolean;
  notes: string;
}

interface RoundDetails {
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
  holes: HoleData[];
}

interface RoundDetailModalProps {
  round: RoundDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoundDetailModal: React.FC<RoundDetailModalProps> = ({
  round,
  open,
  onOpenChange
}) => {
  const [selectedHole, setSelectedHole] = useState<number | null>(null);
  const { toast } = useToast();

  if (!round) return null;

  const par = 72;
  const scoreVsPar = round.totalScore - par;
  
  const getScoreStatus = () => {
    if (scoreVsPar < 0) return { text: 'Under Par', icon: TrendingDown, color: 'text-green-600' };
    if (scoreVsPar === 0) return { text: 'Even Par', icon: Minus, color: 'text-blue-600' };
    return { text: 'Over Par', icon: TrendingUp, color: 'text-orange-600' };
  };

  const getHoleScoreColor = (hole: HoleData) => {
    const holeScore = hole.strokes - hole.par;
    if (holeScore <= -2) return 'text-blue-600 bg-blue-50';
    if (holeScore === -1) return 'text-green-600 bg-green-50';
    if (holeScore === 0) return 'text-gray-600 bg-gray-50';
    if (holeScore === 1) return 'text-yellow-600 bg-yellow-50';
    if (holeScore === 2) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getHoleScoreText = (hole: HoleData) => {
    const holeScore = hole.strokes - hole.par;
    if (holeScore <= -2) return 'Eagle+';
    if (holeScore === -1) return 'Birdie';
    if (holeScore === 0) return 'Par';
    if (holeScore === 1) return 'Bogey';
    if (holeScore === 2) return 'Double';
    return `+${holeScore}`;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/shared/${round.id}`;
    
    const shareText = `🏌️ Round Details
⛳ Course: ${round.courseName}
📅 Date: ${round.datePlayedInfo}
${round.isFlightRound ? `👥 Flight: ${round.flightName}\n🏌️ Player: ${round.playerName}\n` : ''}🏆 Score: ${round.totalScore} (${scoreVsPar > 0 ? '+' : ''}${scoreVsPar})
🏀 Avg Putts: ${round.averagePutts.toFixed(1)}
🎯 GIR: ${round.girPercentage.toFixed(0)}%

View full round details: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Golf Round Details',
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Copied to clipboard!", description: "Round details and link copied to clipboard." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Share failed" });
    }
  };

  const scoreStatus = getScoreStatus();
  const StatusIcon = scoreStatus.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span>Round Details</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Round Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{round.courseName}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{round.datePlayedInfo}</span>
                    </div>
                    {round.isFlightRound && (
                      <>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{round.flightName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{round.playerName}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{round.totalScore}</div>
                  <div className={`flex items-center space-x-1 ${scoreStatus.color}`}>
                    <StatusIcon className="h-4 w-4" />
                    <span className="font-semibold">{scoreStatus.text}</span>
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {scoreVsPar > 0 ? '+' : ''}{scoreVsPar} vs Par
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-primary">{round.totalPutts}</div>
                  <div className="text-xs text-muted-foreground">Total Putts</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-primary">{round.averagePutts.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Avg Putts</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">{round.girPercentage.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">GIR</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{round.fairwayPercentage.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Fairways</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hole-by-Hole Scorecard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Hole-by-Hole Scorecard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {round.holes.map((hole) => (
                  <Button
                    key={hole.hole}
                    variant="outline"
                    size="sm"
                    className={`h-12 flex flex-col items-center justify-center p-1 ${getHoleScoreColor(hole)}`}
                    onClick={() => setSelectedHole(selectedHole === hole.hole ? null : hole.hole)}
                  >
                    <div className="text-xs font-bold">#{hole.hole}</div>
                    <div className="text-lg font-bold">{hole.strokes || '-'}</div>
                    <div className="text-xs">Par {hole.par}</div>
                  </Button>
                ))}
              </div>

              {selectedHole && (
                <Card className="mt-4 border-primary/20">
                  <CardContent className="pt-4">
                    {(() => {
                      const hole = round.holes.find(h => h.hole === selectedHole);
                      if (!hole) return null;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Hole {hole.hole} Details</h4>
                            <Badge variant="outline" className={getHoleScoreColor(hole)}>
                              {getHoleScoreText(hole)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Strokes:</span>
                              <span className="ml-2 font-medium">{hole.strokes}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Putts:</span>
                              <span className="ml-2 font-medium">{hole.putts}</span>
                            </div>
                            {hole.par > 3 && (
                              <div>
                                <span className="text-muted-foreground">Fairway:</span>
                                <span className={`ml-2 font-medium ${hole.fairwayHit ? 'text-green-600' : 'text-red-600'}`}>
                                  {hole.fairwayHit ? 'Hit' : 'Missed'}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">GIR:</span>
                              <span className={`ml-2 font-medium ${hole.greenInRegulation ? 'text-green-600' : 'text-red-600'}`}>
                                {hole.greenInRegulation ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                          
                          {hole.notes && (
                            <div>
                              <span className="text-muted-foreground text-sm">Notes:</span>
                              <p className="mt-1 text-sm">{hole.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share Round
            </Button>
            <Button onClick={() => onOpenChange(false)} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};