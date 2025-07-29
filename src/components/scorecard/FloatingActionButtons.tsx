import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Save, 
  Share2,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonsProps {
  onQuickStroke: (increment: boolean) => void;
  onReset: () => void;
  onSave: () => void;
  onShare: () => void;
  onPrevHole: () => void;
  onNextHole: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  currentHole: number;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onQuickStroke,
  onReset,
  onSave,
  onShare,
  onPrevHole,
  onNextHole,
  canGoPrev,
  canGoNext,
  currentHole
}) => {
  return (
    <>
      {/* Main FAB Group - Right Side */}
      <div className="fixed right-4 bottom-24 flex flex-col space-y-3 z-50">
        {/* Quick Add Stroke */}
        <Button
          size="sm"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => onQuickStroke(true)}
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        {/* Quick Remove Stroke */}
        <Button
          variant="outline"
          size="sm"
          className="h-12 w-12 rounded-full shadow-lg bg-background"
          onClick={() => onQuickStroke(false)}
        >
          <Minus className="h-5 w-5" />
        </Button>
        
        {/* Reset Hole */}
        <Button
          variant="outline"
          size="sm"
          className="h-12 w-12 rounded-full shadow-lg bg-background"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation FABs - Left Side */}
      <div className="fixed left-4 bottom-24 flex flex-col space-y-3 z-50">
        {/* Previous Hole */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg bg-background",
            !canGoPrev && "opacity-50"
          )}
          onClick={onPrevHole}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        {/* Next Hole */}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg bg-background",
            !canGoNext && "opacity-50"
          )}
          onClick={onNextHole}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Action FABs - Bottom Center */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 flex space-x-3 z-50">
        {/* Save */}
        <Button
          size="sm"
          className="h-12 px-4 rounded-full shadow-lg"
          onClick={onSave}
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        
        {/* Share */}
        <Button
          variant="outline"
          size="sm"
          className="h-12 px-4 rounded-full shadow-lg bg-background"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </>
  );
};