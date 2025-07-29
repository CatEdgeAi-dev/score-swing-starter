import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdvancedHoleNavigationProps {
  currentHole: number;
  totalHoles: number;
  onHoleSelect: (hole: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  holesWithData?: number[]; // Array of hole numbers that have data
  className?: string;
}

export const AdvancedHoleNavigation: React.FC<AdvancedHoleNavigationProps> = ({
  currentHole,
  totalHoles,
  onHoleSelect,
  onPrevious,
  onNext,
  holesWithData = [],
  className
}) => {
  const canGoPrevious = currentHole > 1;
  const canGoNext = currentHole < totalHoles;
  const progressPercentage = (currentHole / totalHoles) * 100;

  // Generate hole list for dropdown
  const holeList = Array.from({ length: totalHoles }, (_, i) => i + 1);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}% complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-sm">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(
            "flex items-center space-x-2 h-10 px-3 transition-all duration-200",
            canGoPrevious 
              ? "hover:bg-primary hover:text-primary-foreground hover-scale" 
              : "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">Prev</span>
        </Button>

        {/* Current Hole with Dropdown */}
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2 h-10 px-3 hover:bg-muted"
              >
                <Badge 
                  variant="secondary" 
                  className="text-sm font-semibold px-3 py-1"
                >
                  Hole {currentHole}
                </Badge>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="max-h-64 overflow-y-auto">
              {holeList.map((hole) => (
                <DropdownMenuItem
                  key={hole}
                  onClick={() => onHoleSelect(hole)}
                  className={cn(
                    "flex items-center justify-between",
                    hole === currentHole && "bg-accent",
                    holesWithData.includes(hole) && "font-medium"
                  )}
                >
                  <span>Hole {hole}</span>
                  {holesWithData.includes(hole) && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-xs text-muted-foreground">
            of {totalHoles}
          </div>
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            "flex items-center space-x-2 h-10 px-3 transition-all duration-200",
            canGoNext 
              ? "hover:bg-primary hover:text-primary-foreground hover-scale" 
              : "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="hidden sm:inline text-sm">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Navigation Dots (for visual reference) */}
      <div className="flex justify-center space-x-1">
        {holeList.slice(0, Math.min(9, totalHoles)).map((hole) => (
          <button
            key={hole}
            onClick={() => onHoleSelect(hole)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200 hover-scale",
              hole === currentHole 
                ? "bg-primary scale-125" 
                : holesWithData.includes(hole)
                ? "bg-primary/60"
                : "bg-muted-foreground/30"
            )}
            aria-label={`Go to hole ${hole}`}
          />
        ))}
        {totalHoles > 9 && (
          <>
            <div className="w-1 h-2 flex items-center">
              <div className="w-full h-px bg-muted-foreground/30" />
            </div>
            {holeList.slice(-9).map((hole) => (
              <button
                key={hole}
                onClick={() => onHoleSelect(hole)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200 hover-scale",
                  hole === currentHole 
                    ? "bg-primary scale-125" 
                    : holesWithData.includes(hole)
                    ? "bg-primary/60"
                    : "bg-muted-foreground/30"
                )}
                aria-label={`Go to hole ${hole}`}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};