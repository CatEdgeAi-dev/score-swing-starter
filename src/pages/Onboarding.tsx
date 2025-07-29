import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  BarChart3, 
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Play,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Golf Scorecard!',
    description: 'Your complete golf tracking companion',
    icon: Trophy,
    features: [
      'Track detailed hole-by-hole scores',
      'Play solo or create flights with friends',
      'View comprehensive statistics and trends',
      'Save and share your best rounds'
    ]
  },
  {
    id: 'scoring',
    title: 'Easy Scoring',
    description: 'Track every detail of your game',
    icon: Target,
    features: [
      'Quick +/- buttons or direct input',
      'Track putts, fairways, and GIR',
      'Add notes for each hole',
      'Swipe navigation between holes'
    ]
  },
  {
    id: 'flights',
    title: 'Play with Friends',
    description: 'Create flights and compete together',
    icon: Users,
    features: [
      'Create flights with up to 4 players',
      'Switch between player scorecards',
      'Invite guests or registered users',
      'Everyone tracks their own scores'
    ]
  },
  {
    id: 'stats',
    title: 'Track Your Progress',
    description: 'Analyze your game with detailed statistics',
    icon: BarChart3,
    features: [
      'Round history and trends',
      'Handicap tracking and improvements',
      'Hole-by-hole performance analysis',
      'Share achievements with friends'
    ]
  }
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding before
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (seen) {
      navigate('/rounds');
      return;
    }

    // If not authenticated, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
    navigate('/rounds');
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    navigate('/rounds');
  };

  if (!user || hasSeenOnboarding) {
    return null;
  }

  const currentStepData = onboardingSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {onboardingSteps.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <CardTitle className="text-xl mb-2">{currentStepData.title}</CardTitle>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {currentStepData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {currentStep === 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Getting Started</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This quick tour will show you how to make the most of your golf tracking experience.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex space-x-1">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <Button onClick={handleNext} className="gap-2">
              {isLastStep ? (
                <>
                  <Play className="h-4 w-4" />
                  Start Playing
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;