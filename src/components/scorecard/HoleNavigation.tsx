import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoleNavigationProps {
  currentHole: number;
  totalHoles: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

export const HoleNavigation: React.FC<HoleNavigationProps> = ({
  currentHole,
  totalHoles,
  onPrevious,
  onNext,
  className
}) => {
  const canGoPrevious = currentHole > 1;
  const canGoNext = currentHole < totalHoles;

  return (
    <div className={cn("flex items-center justify-between bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-sm", className)}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={cn(
          "flex items-center space-x-2 h-10 px-4 transition-all duration-200",
          canGoPrevious 
            ? "hover:bg-primary hover:text-primary-foreground hover-scale" 
            : "opacity-50 cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Current Hole Indicator */}
      <div className="flex flex-col items-center space-y-1">
        <Badge 
          variant="secondary" 
          className="text-sm font-semibold px-3 py-1 animate-fade-in"
        >
          Hole {currentHole}
        </Badge>
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
          "flex items-center space-x-2 h-10 px-4 transition-all duration-200",
          canGoNext 
            ? "hover:bg-primary hover:text-primary-foreground hover-scale" 
            : "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};