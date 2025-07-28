import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Golf Scorecard</CardTitle>
          <p className="text-muted-foreground">Track your rounds, improve your game</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ Track strokes and putts</p>
            <p>✓ Monitor fairways and GIR</p>
            <p>✓ Add notes for each hole</p>
            <p>✓ View real-time statistics</p>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full min-h-[44px]" 
              onClick={() => navigate('/scorecard')}
            >
              Start New Round
            </Button>
            <Button 
              variant="outline" 
              className="w-full min-h-[44px]"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
