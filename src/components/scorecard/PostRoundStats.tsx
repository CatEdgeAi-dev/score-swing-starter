import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Share2,
  Home
} from 'lucide-react';

interface PostRoundStatsProps {
  totalScore: number;
  totalPutts: number;
  averagePutts: number;
  girPercentage: number;
  fairwayPercentage: number;
  courseName: string;
  playerName?: string;
  onShare: () => void;
  onNewRound: () => void;
  onGoHome: () => void;
}

export const PostRoundStats: React.FC<PostRoundStatsProps> = ({
  totalScore,
  totalPutts,
  averagePutts,
  girPercentage,
  fairwayPercentage,
  courseName,
  playerName,
  onShare,
  onNewRound,
  onGoHome
}) => {
  const par = 72; // Standard par for 18 holes
  const scoreVsPar = totalScore - par;
  
  const getScoreStatus = () => {
    if (scoreVsPar < 0) return { text: 'Under Par!', icon: TrendingDown, color: 'text-green-600' };
    if (scoreVsPar === 0) return { text: 'Even Par!', icon: Minus, color: 'text-blue-600' };
    return { text: 'Over Par', icon: TrendingUp, color: 'text-orange-600' };
  };

  const getPerformanceLevel = () => {
    const girGood = girPercentage >= 50;
    const puttsGood = averagePutts <= 2.0;
    const scoreGood = scoreVsPar <= 10;

    if (girGood && puttsGood && scoreGood) return 'Excellent Round!';
    if ((girGood && puttsGood) || (girGood && scoreGood) || (puttsGood && scoreGood)) return 'Good Round!';
    return 'Keep Practicing!';
  };

  const scoreStatus = getScoreStatus();
  const StatusIcon = scoreStatus.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Trophy className="h-12 w-12 mx-auto text-yellow-500" />
        <h2 className="text-2xl font-bold">Round Complete!</h2>
        <p className="text-muted-foreground">
          {playerName ? `${playerName} - ` : ''}{courseName}
        </p>
      </div>

      {/* Main Score */}
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="text-4xl font-bold text-primary">{totalScore}</div>
            <div className={`flex items-center justify-center space-x-2 ${scoreStatus.color}`}>
              <StatusIcon className="h-5 w-5" />
              <span className="font-semibold">{scoreStatus.text}</span>
            </div>
            <Badge variant="secondary" className="text-sm">
              {scoreVsPar > 0 ? '+' : ''}{scoreVsPar} vs Par
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">{getPerformanceLevel()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-primary">{totalPutts}</div>
              <div className="text-xs text-muted-foreground">Total Putts</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-primary">{averagePutts.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg Putts</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">{girPercentage.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Greens in Regulation</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">{fairwayPercentage.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Fairways Hit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button onClick={onShare} className="w-full" variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          Share Round
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onNewRound} className="w-full">
            <Target className="h-4 w-4 mr-2" />
            New Round
          </Button>
          <Button onClick={onGoHome} variant="outline" className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};