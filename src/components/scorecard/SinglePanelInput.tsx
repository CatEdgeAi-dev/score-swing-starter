import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useScorecardContext } from './ScorecardContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const defaultPars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4];

export const SinglePanelInput: React.FC = () => {
  const { holes, updateHole } = useScorecardContext();
  const { toast } = useToast();

  const handleStrokesChange = (holeNumber: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newStrokes = Math.max(0, Math.min(20, numValue));
    updateHole(holeNumber, { strokes: newStrokes });
  };

  const handlePuttsChange = (holeNumber: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newPutts = Math.max(0, Math.min(10, numValue));
    updateHole(holeNumber, { putts: newPutts });
  };

  const getScoreColor = (holeNumber: number) => {
    const hole = holes[holeNumber];
    const scoreVsPar = hole.strokes - hole.par;
    if (scoreVsPar <= -2) return 'text-blue-600 bg-blue-50';
    if (scoreVsPar === -1) return 'text-green-600 bg-green-50';
    if (scoreVsPar === 0) return 'text-gray-600 bg-gray-50';
    if (scoreVsPar === 1) return 'text-yellow-600 bg-yellow-50';
    if (scoreVsPar === 2) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreText = (holeNumber: number) => {
    const hole = holes[holeNumber];
    const scoreVsPar = hole.strokes - hole.par;
    if (hole.strokes === 0) return '';
    if (scoreVsPar <= -2) return 'Eagle+';
    if (scoreVsPar === -1) return 'Birdie';
    if (scoreVsPar === 0) return 'Par';
    if (scoreVsPar === 1) return 'Bogey';
    if (scoreVsPar === 2) return 'Double';
    return `+${scoreVsPar}`;
  };

  const quickAdd = (holeNumber: number, type: 'strokes' | 'putts', amount: number) => {
    const hole = holes[holeNumber];
    const currentValue = type === 'strokes' ? hole.strokes : hole.putts;
    const newValue = Math.max(0, currentValue + amount);
    const maxValue = type === 'strokes' ? 20 : 10;
    
    if (newValue <= maxValue) {
      updateHole(holeNumber, { [type]: newValue });
      
      toast({
        title: `${type === 'strokes' ? 'Strokes' : 'Putts'} ${amount > 0 ? 'added' : 'removed'}`,
        description: `Hole ${holeNumber}: ${newValue} ${type}`,
        duration: 1000,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Front Nine */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Front Nine (1-9)</span>
            <Badge variant="outline" className="text-xs">
              {Object.values(holes).slice(0, 9).reduce((sum, hole) => sum + hole.strokes, 0)} strokes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((holeNumber) => {
              const hole = holes[holeNumber];
              return (
                <div
                  key={holeNumber}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    hole.strokes > 0 ? getScoreColor(holeNumber) : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {holeNumber}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Par {hole.par}</div>
                      {hole.strokes > 0 && (
                        <div className="text-xs opacity-75">
                          {getScoreText(holeNumber)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center space-y-1">
                      <Label className="text-xs">Strokes</Label>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'strokes', -1)}
                          disabled={hole.strokes <= 0}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={hole.strokes || ''}
                          onChange={(e) => handleStrokesChange(holeNumber, e.target.value)}
                          className="w-12 h-6 text-center text-xs p-1"
                          placeholder="0"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'strokes', 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-1">
                      <Label className="text-xs">Putts</Label>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'putts', -1)}
                          disabled={hole.putts <= 0}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={hole.putts || ''}
                          onChange={(e) => handlePuttsChange(holeNumber, e.target.value)}
                          className="w-12 h-6 text-center text-xs p-1"
                          placeholder="0"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'putts', 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Back Nine */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Back Nine (10-18)</span>
            <Badge variant="outline" className="text-xs">
              {Object.values(holes).slice(9, 18).reduce((sum, hole) => sum + hole.strokes, 0)} strokes
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 9 }, (_, i) => i + 10).map((holeNumber) => {
              const hole = holes[holeNumber];
              return (
                <div
                  key={holeNumber}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    hole.strokes > 0 ? getScoreColor(holeNumber) : "bg-muted/30"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {holeNumber}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Par {hole.par}</div>
                      {hole.strokes > 0 && (
                        <div className="text-xs opacity-75">
                          {getScoreText(holeNumber)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center space-y-1">
                      <Label className="text-xs">Strokes</Label>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'strokes', -1)}
                          disabled={hole.strokes <= 0}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={hole.strokes || ''}
                          onChange={(e) => handleStrokesChange(holeNumber, e.target.value)}
                          className="w-12 h-6 text-center text-xs p-1"
                          placeholder="0"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'strokes', 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-1">
                      <Label className="text-xs">Putts</Label>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'putts', -1)}
                          disabled={hole.putts <= 0}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={hole.putts || ''}
                          onChange={(e) => handlePuttsChange(holeNumber, e.target.value)}
                          className="w-12 h-6 text-center text-xs p-1"
                          placeholder="0"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-6 h-6 p-0 text-xs"
                          onClick={() => quickAdd(holeNumber, 'putts', 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};