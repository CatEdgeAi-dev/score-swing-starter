import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useScorecardContext } from './ScorecardContext';

interface HoleInputProps {
  holeNumber: number;
}

export const HoleInput: React.FC<HoleInputProps> = ({ holeNumber }) => {
  const { holes, updateHole } = useScorecardContext();
  const defaultHole: import('./ScorecardContext').HoleData = {
    strokes: 0,
    putts: 0,
    fairwayHit: false,
    greenInRegulation: false,
    upAndDown: false,
    notes: '',
    par: 4,
  };
  const hole = holes[holeNumber] ?? defaultHole;

  const handleStrokesChange = (change: number) => {
    const newStrokes = Math.max(0, hole.strokes + change);
    updateHole(holeNumber, { strokes: newStrokes });
  };

  const handleStrokesInput = (value: string) => {
    const numValue = parseInt(value) || 0;
    const newStrokes = Math.max(0, Math.min(20, numValue)); // Cap at 20 strokes
    updateHole(holeNumber, { strokes: newStrokes });
  };

  const handlePuttsChange = (change: number) => {
    const newPutts = Math.max(0, hole.putts + change);
    updateHole(holeNumber, { putts: newPutts });
  };

  const handlePuttsInput = (value: string) => {
    const numValue = parseInt(value) || 0;
    const newPutts = Math.max(0, Math.min(10, numValue)); // Cap at 10 putts
    updateHole(holeNumber, { putts: newPutts });
  };

  const getScoreColor = () => {
    const scoreVsPar = hole.strokes - hole.par;
    if (scoreVsPar <= -2) return 'text-blue-600';
    if (scoreVsPar === -1) return 'text-green-600';
    if (scoreVsPar === 0) return 'text-gray-600';
    if (scoreVsPar === 1) return 'text-yellow-600';
    if (scoreVsPar === 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreText = () => {
    const scoreVsPar = hole.strokes - hole.par;
    if (scoreVsPar <= -2) return 'Eagle or better';
    if (scoreVsPar === -1) return 'Birdie';
    if (scoreVsPar === 0) return 'Par';
    if (scoreVsPar === 1) return 'Bogey';
    if (scoreVsPar === 2) return 'Double Bogey';
    return `+${scoreVsPar}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
              {holeNumber}
            </div>
            <div className="text-sm text-muted-foreground">
              Par {hole.par}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>

        {/* Main scoring controls */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Strokes</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handleStrokesChange(-1)}
                disabled={hole.strokes <= 0}
              >
                -
              </Button>
              <Input
                type="number"
                min="0"
                max="20"
                value={hole.strokes || ''}
                onChange={(e) => handleStrokesInput(e.target.value)}
                className="w-16 h-8 text-center font-bold text-lg p-1"
                placeholder="0"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handleStrokesChange(1)}
              >
                +
              </Button>
            </div>
            {hole.strokes > 0 && (
              <div className={`text-xs text-center ${getScoreColor()}`}>
                {getScoreText()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Putts</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePuttsChange(-1)}
                disabled={hole.putts <= 0}
              >
                -
              </Button>
              <Input
                type="number"
                min="0"
                max="10"
                value={hole.putts || ''}
                onChange={(e) => handlePuttsInput(e.target.value)}
                className="w-16 h-8 text-center font-bold text-lg p-1"
                placeholder="0"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => handlePuttsChange(1)}
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded controls */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {hole.par > 3 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fairway Hit</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={hole.fairwayHit ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => updateHole(holeNumber, { fairwayHit: true })}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={!hole.fairwayHit ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => updateHole(holeNumber, { fairwayHit: false })}
                  >
                    No
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Green in Regulation</Label>
              <div className="flex space-x-2">
                <Button
                  variant={hole.greenInRegulation ? "default" : "outline"}
                  size="sm"
                  className="flex-1 min-h-[44px]"
                  onClick={() => updateHole(holeNumber, { greenInRegulation: true })}
                >
                  Yes
                </Button>
                <Button
                  variant={!hole.greenInRegulation ? "default" : "outline"}
                  size="sm"
                  className="flex-1 min-h-[44px]"
                  onClick={() => updateHole(holeNumber, { greenInRegulation: false })}
                >
                  No
                </Button>
              </div>
            </div>

            {!hole.greenInRegulation && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Up & Down</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={hole.upAndDown ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => updateHole(holeNumber, { upAndDown: true })}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={!hole.upAndDown ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-h-[44px]"
                    onClick={() => updateHole(holeNumber, { upAndDown: false })}
                  >
                    No
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                placeholder="Add notes about this hole..."
                value={hole.notes}
                onChange={(e) => updateHole(holeNumber, { notes: e.target.value })}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};