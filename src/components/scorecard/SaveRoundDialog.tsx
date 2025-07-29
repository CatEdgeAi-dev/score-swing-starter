import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRounds } from '@/hooks/useRounds';
import { useScorecardContext } from './ScorecardContext';
import { Loader2 } from 'lucide-react';

interface SaveRoundDialogProps {
  children: React.ReactNode;
}

export const SaveRoundDialog: React.FC<SaveRoundDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const { holes, resetScorecard } = useScorecardContext();
  const { saveRound, loading } = useRounds();

  const handleSave = async () => {
    const savedRound = await saveRound(holes, courseName || undefined);
    if (savedRound) {
      setOpen(false);
      setCourseName('');
      resetScorecard();
    }
  };

  const hasScores = Object.values(holes).some(hole => hole.strokes > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Golf Round</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-name">Course Name (Optional)</Label>
            <Input
              id="course-name"
              placeholder="Enter course name..."
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasScores || loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Round
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
          {!hasScores && (
            <p className="text-sm text-muted-foreground">
              Enter at least one score to save your round.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};