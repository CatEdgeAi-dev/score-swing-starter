import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatSummaryProps {
  totalScore: number;
  averagePutts: number;
  girPercentage: number;
}

export const StatSummary: React.FC<StatSummaryProps> = ({
  totalScore,
  averagePutts,
  girPercentage
}) => {
  const totalPar = 72; // Standard 18-hole par
  const scoreVsPar = totalScore - totalPar;
  
  const getScoreDisplay = () => {
    if (totalScore === 0) return 'No scores entered';
    if (scoreVsPar === 0) return 'Even par';
    if (scoreVsPar > 0) return `+${scoreVsPar}`;
    return `${scoreVsPar}`;
  };

  const getScoreColor = () => {
    if (totalScore === 0) return 'text-muted-foreground';
    if (scoreVsPar <= -5) return 'text-blue-600';
    if (scoreVsPar <= -1) return 'text-green-600';
    if (scoreVsPar === 0) return 'text-gray-600';
    if (scoreVsPar <= 5) return 'text-yellow-600';
    if (scoreVsPar <= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-lg">Round Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {/* Total Score */}
          <div className="text-center space-y-1">
            <div className="text-3xl font-bold">
              {totalScore > 0 ? totalScore : '-'}
            </div>
            <div className={`text-lg font-medium ${getScoreColor()}`}>
              {getScoreDisplay()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Score vs Par {totalPar}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-primary">
                {averagePutts > 0 ? averagePutts.toFixed(1) : '-'}
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Putts
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-success">
                {girPercentage > 0 ? `${girPercentage.toFixed(0)}%` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">
                Greens in Regulation
              </div>
            </div>
          </div>

          {/* Performance indicators */}
          {totalScore > 0 && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Putting Performance:</span>
                <span className={averagePutts <= 1.8 ? 'text-green-600' : averagePutts <= 2.2 ? 'text-yellow-600' : 'text-red-600'}>
                  {averagePutts <= 1.8 ? 'Excellent' : averagePutts <= 2.2 ? 'Good' : 'Needs Work'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GIR Performance:</span>
                <span className={girPercentage >= 60 ? 'text-green-600' : girPercentage >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                  {girPercentage >= 60 ? 'Excellent' : girPercentage >= 40 ? 'Good' : 'Needs Work'}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};