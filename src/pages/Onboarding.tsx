import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Trophy, 
  Users, 
  BarChart3, 
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Play,
  Sparkles,
  User,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'intro' | 'form';
}

interface ProfileData {
  display_name: string;
  home_course: string;
  experience_level: string;
  playing_frequency: string;
  favorite_course_type: string;
  golf_goals: string[];
  preferred_tee_times: string[];
  location: string;
  age_range: string;
  hobbies: string[];
  availability: string[];
  open_to_matches: boolean;
  group_play_interest: boolean;
  competitive_play_interest: boolean;
  mentoring_interest: string;
  whs_index: string;
  show_handicap: boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Birdie Buddies!',
    description: 'Your complete golf tracking and social companion',
    icon: Trophy,
    type: 'intro'
  },
  {
    id: 'profile',
    title: 'Tell Us About Yourself',
    description: 'Help us personalize your experience',
    icon: User,
    type: 'form'
  },
  {
    id: 'golf',
    title: 'Your Golf Profile',
    description: 'Share your golf preferences and goals',
    icon: Target,
    type: 'form'
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Interests',
    description: 'Tell us about your lifestyle and availability',
    icon: MapPin,
    type: 'form'
  },
  {
    id: 'handicap',
    title: 'Handicap Information',
    description: 'Share your current handicap (optional)',
    icon: BarChart3,
    type: 'form'
  },
  {
    id: 'community',
    title: 'Community Preferences',
    description: 'How would you like to connect with other golfers?',
    icon: Users,
    type: 'form'
  }
];

const golfGoalsOptions = [
  'Lower my handicap',
  'Play more consistently',
  'Improve short game',
  'Play more courses',
  'Have more fun',
  'Meet new people',
  'Join tournaments',
  'Learn course management'
];

const hobbiesOptions = [
  'Reading',
  'Traveling',
  'Cooking',
  'Photography',
  'Music',
  'Sports (other)',
  'Fitness',
  'Technology',
  'Gardening',
  'Art',
  'Movies/TV',
  'Outdoor activities'
];

const availabilityOptions = [
  'Early morning (6-9 AM)',
  'Morning (9 AM-12 PM)',
  'Afternoon (12-4 PM)',
  'Late afternoon (4-7 PM)',
  'Evening (after 7 PM)'
];

const teeTimeOptions = [
  'Dawn patrol (6-8 AM)',
  'Morning (8-11 AM)',
  'Late morning (11 AM-1 PM)',
  'Afternoon (1-4 PM)',
  'Twilight (after 4 PM)'
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    home_course: '',
    experience_level: '',
    playing_frequency: '',
    favorite_course_type: '',
    golf_goals: [],
    preferred_tee_times: [],
    location: '',
    age_range: '',
    hobbies: [],
    availability: [],
    open_to_matches: true,
    group_play_interest: true,
    competitive_play_interest: false,
    mentoring_interest: 'none',
    whs_index: '',
    show_handicap: true
  });

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
  const currentStepData = onboardingSteps[currentStep];

  const handleArrayToggle = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleNext = async () => {
    if (isLastStep) {
      await handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Save profile data to Supabase
      const profilePayload = {
        ...(user?.id ? { id: user.id } : {}),
        ...profileData,
        whs_index: profileData.whs_index ? parseFloat(profileData.whs_index) : null,
        community_onboarding_completed: true,
        community_onboarding_step: onboardingSteps.length
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profilePayload);

      if (error) throw error;

      localStorage.setItem('hasSeenOnboarding', 'true');
      setHasSeenOnboarding(true);
      toast.success('Welcome to Birdie Buddies! Your profile has been set up.');
      navigate('/rounds');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    navigate('/rounds');
  };

  if (!user || hasSeenOnboarding) {
    return null;
  }

  const step = onboardingSteps[currentStep] ?? onboardingSteps[0];
  const Icon = step.icon;

  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">What's Next?</span>
              </div>
              <p className="text-xs text-muted-foreground">
                We'll ask you a few questions to personalize your golf experience and help you connect with other golfers.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Set up your golf profile</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Share your interests and availability</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Choose your community preferences</span>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={profileData.display_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="How should others see your name?"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State or Region"
              />
            </div>
            <div>
              <Label htmlFor="age_range">Age Range</Label>
              <Select value={profileData.age_range} onValueChange={(value) => setProfileData(prev => ({ ...prev, age_range: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-55">46-55</SelectItem>
                  <SelectItem value="56-65">56-65</SelectItem>
                  <SelectItem value="65+">65+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'golf':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="home_course">Home Course</Label>
              <Input
                id="home_course"
                value={profileData.home_course}
                onChange={(e) => setProfileData(prev => ({ ...prev, home_course: e.target.value }))}
                placeholder="Your regular golf course"
              />
            </div>
            <div>
              <Label htmlFor="experience_level">Experience Level</Label>
              <Select value={profileData.experience_level} onValueChange={(value) => setProfileData(prev => ({ ...prev, experience_level: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="How long have you been playing?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (3-7 years)</SelectItem>
                  <SelectItem value="advanced">Advanced (8+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="playing_frequency">How Often Do You Play?</Label>
              <Select value={profileData.playing_frequency} onValueChange={(value) => setProfileData(prev => ({ ...prev, playing_frequency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Golf Goals (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {golfGoalsOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={profileData.golf_goals.includes(goal)}
                      onCheckedChange={() => handleArrayToggle('golf_goals', goal)}
                    />
                    <Label htmlFor={`goal-${goal}`} className="text-xs">{goal}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'lifestyle':
        return (
          <div className="space-y-4">
            <div>
              <Label>Hobbies & Interests (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {hobbiesOptions.map((hobby) => (
                  <div key={hobby} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hobby-${hobby}`}
                      checked={profileData.hobbies.includes(hobby)}
                      onCheckedChange={() => handleArrayToggle('hobbies', hobby)}
                    />
                    <Label htmlFor={`hobby-${hobby}`} className="text-xs">{hobby}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Preferred Tee Times</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {teeTimeOptions.map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={`time-${time}`}
                      checked={profileData.preferred_tee_times.includes(time)}
                      onCheckedChange={() => handleArrayToggle('preferred_tee_times', time)}
                    />
                    <Label htmlFor={`time-${time}`} className="text-sm">{time}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'handicap':
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Your handicap helps other golfers understand your skill level and find suitable playing partners.
              </p>
            </div>
            <div>
              <Label htmlFor="whs_index">WHS Handicap Index (optional)</Label>
              <Input
                id="whs_index"
                type="number"
                step="0.1"
                value={profileData.whs_index}
                onChange={(e) => setProfileData(prev => ({ ...prev, whs_index: e.target.value }))}
                placeholder="e.g., 12.4"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your official World Handicap System index if you have one
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show_handicap">Show handicap to other players</Label>
              <Checkbox
                id="show_handicap"
                checked={profileData.show_handicap}
                onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, show_handicap: checked as boolean }))}
              />
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-primary">
                💡 You can always update your handicap later in your profile settings
              </p>
            </div>
          </div>
        );

      case 'community':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="open_to_matches">Open to playing with new people</Label>
                <Checkbox
                  id="open_to_matches"
                  checked={profileData.open_to_matches}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, open_to_matches: checked as boolean }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="group_play_interest">Interested in group play</Label>
                <Checkbox
                  id="group_play_interest"
                  checked={profileData.group_play_interest}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, group_play_interest: checked as boolean }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="competitive_play_interest">Interested in competitive play</Label>
                <Checkbox
                  id="competitive_play_interest"
                  checked={profileData.competitive_play_interest}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, competitive_play_interest: checked as boolean }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mentoring_interest">Mentoring Interest</Label>
              <Select value={profileData.mentoring_interest} onValueChange={(value) => setProfileData(prev => ({ ...prev, mentoring_interest: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Are you interested in mentoring?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not interested</SelectItem>
                  <SelectItem value="mentor">I'd like to mentor others</SelectItem>
                  <SelectItem value="mentee">I'd like to be mentored</SelectItem>
                  <SelectItem value="both">Both mentoring and being mentored</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
            <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
            <p className="text-muted-foreground">{step.description}</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepContent()}

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
            
            <Button onClick={handleNext} disabled={loading} className="gap-2">
              {loading ? (
                'Saving...'
              ) : isLastStep ? (
                <>
                  <Play className="h-4 w-4" />
                  Complete Setup
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