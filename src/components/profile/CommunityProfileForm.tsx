import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader2, X } from 'lucide-react';

interface CommunityProfile {
  home_course?: string;
  preferred_tee_times?: string[];
  playing_frequency?: string;
  favorite_course_type?: string;
  golf_goals?: string[];
  experience_level?: string;
  hobbies?: string[];
  age_range?: string;
  location?: string;
  occupation?: string;
  availability?: string[];
  open_to_matches?: boolean;
  mentoring_interest?: string;
  group_play_interest?: boolean;
  competitive_play_interest?: boolean;
  profile_visibility?: string;
  show_handicap?: boolean;
  show_location?: boolean;
  show_contact_info?: boolean;
  profile_completion_percentage?: number;
}

const teeTimeOptions = ['Early Morning (6-8 AM)', 'Morning (8-11 AM)', 'Midday (11 AM-2 PM)', 'Afternoon (2-5 PM)', 'Evening (5-8 PM)'];
const availabilityOptions = [
  { value: 'weekday_morning', label: 'Weekday Morning' },
  { value: 'weekday_afternoon', label: 'Weekday Afternoon' },
  { value: 'weekday_evening', label: 'Weekday Evening' },
  { value: 'weekend_morning', label: 'Weekend Morning' },
  { value: 'weekend_afternoon', label: 'Weekend Afternoon' },
  { value: 'weekend_evening', label: 'Weekend Evening' }
];

const golfGoalOptions = ['Lower Handicap', 'More Consistent Play', 'Enjoy the Game', 'Tournament Play', 'Social Golf', 'Fitness', 'Learn New Courses'];
const hobbyOptions = ['Travel', 'Photography', 'Cooking', 'Reading', 'Music', 'Fitness', 'Technology', 'Art', 'Sports', 'Gardening'];

export function CommunityProfileForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CommunityProfile>({});
  const [customGoal, setCustomGoal] = useState('');
  const [customHobby, setCustomHobby] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CommunityProfile>();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        const sanitized = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
        ) as CommunityProfile;
        setProfile(sanitized);
        // Set form values
        Object.keys(sanitized).forEach(key => {
          // @ts-expect-error dynamic form key mapping
          setValue(key as keyof CommunityProfile, (sanitized as any)[key]);
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: CommunityProfile) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      // Refresh profile to get updated completion percentage
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCustomGoal = () => {
    if (customGoal.trim()) {
      const currentGoals = profile.golf_goals || [];
      const updatedGoals = [...currentGoals, customGoal.trim()];
      setProfile(prev => ({ ...prev, golf_goals: updatedGoals }));
      setValue('golf_goals', updatedGoals);
      setCustomGoal('');
    }
  };

  const removeGoal = (goalToRemove: string) => {
    const updatedGoals = (profile.golf_goals || []).filter(goal => goal !== goalToRemove);
    setProfile(prev => ({ ...prev, golf_goals: updatedGoals }));
    setValue('golf_goals', updatedGoals);
  };

  const addCustomHobby = () => {
    if (customHobby.trim()) {
      const currentHobbies = profile.hobbies || [];
      const updatedHobbies = [...currentHobbies, customHobby.trim()];
      setProfile(prev => ({ ...prev, hobbies: updatedHobbies }));
      setValue('hobbies', updatedHobbies);
      setCustomHobby('');
    }
  };

  const removeHobby = (hobbyToRemove: string) => {
    const updatedHobbies = (profile.hobbies || []).filter(hobby => hobby !== hobbyToRemove);
    setProfile(prev => ({ ...prev, hobbies: updatedHobbies }));
    setValue('hobbies', updatedHobbies);
  };

  const toggleArrayValue = (array: string[], value: string, fieldName: keyof CommunityProfile) => {
    const updatedArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    setProfile(prev => ({ ...prev, [fieldName]: updatedArray }));
    setValue(fieldName, updatedArray as any);
  };

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>
            Complete your profile to help others find and connect with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {profile.profile_completion_percentage || 0}%
              </span>
            </div>
            <Progress value={profile.profile_completion_percentage || 0} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Golf Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Golf Preferences</CardTitle>
          <CardDescription>Tell us about your golf interests and habits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="home_course">Home Course</Label>
              <Input
                id="home_course"
                {...register('home_course')}
                placeholder="e.g., Pebble Beach Golf Links"
              />
            </div>
            
              <div>
                <Label htmlFor="experience_level">Experience Level</Label>
                <Select value={watchedValues.experience_level ?? ''} onValueChange={(value) => setValue('experience_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            <div>
              <Label htmlFor="playing_frequency">Playing Frequency</Label>
              <Select value={watchedValues.playing_frequency ?? ''} onValueChange={(value) => setValue('playing_frequency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How often do you play?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="occasionally">Occasionally</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="favorite_course_type">Favorite Course Type</Label>
              <Select value={watchedValues.favorite_course_type ?? ''} onValueChange={(value) => setValue('favorite_course_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="links">Links</SelectItem>
                  <SelectItem value="parkland">Parkland</SelectItem>
                  <SelectItem value="desert">Desert</SelectItem>
                  <SelectItem value="mountain">Mountain</SelectItem>
                  <SelectItem value="resort">Resort</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Preferred Tee Times</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {teeTimeOptions.map((time) => (
                <div key={time} className="flex items-center space-x-2">
                  <Checkbox
                    id={time}
                    checked={(profile.preferred_tee_times || []).includes(time)}
                    onCheckedChange={() => toggleArrayValue(profile.preferred_tee_times || [], time, 'preferred_tee_times')}
                  />
                  <Label htmlFor={time} className="text-sm">{time}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Golf Goals</Label>
            <div className="space-y-2 mt-2">
              <div className="flex flex-wrap gap-2">
                {(profile.golf_goals || []).map((goal) => (
                  <Badge key={goal} variant="secondary" className="flex items-center gap-1">
                    {goal}
                    <X size={12} className="cursor-pointer" onClick={() => removeGoal(goal)} />
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {golfGoalOptions.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={(profile.golf_goals || []).includes(goal)}
                      onCheckedChange={() => toggleArrayValue(profile.golf_goals || [], goal, 'golf_goals')}
                    />
                    <Label htmlFor={goal} className="text-sm">{goal}</Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom goal"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGoal())}
                />
                <Button type="button" onClick={addCustomGoal} size="sm">Add</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Lifestyle & Interests</CardTitle>
          <CardDescription>Help others connect with you beyond golf</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age_range">Age Range</Label>
              <Select value={watchedValues.age_range ?? ''} onValueChange={(value) => setValue('age_range', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
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

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                {...register('occupation')}
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>

          <div>
            <Label>Hobbies & Interests</Label>
            <div className="space-y-2 mt-2">
              <div className="flex flex-wrap gap-2">
                {(profile.hobbies || []).map((hobby) => (
                  <Badge key={hobby} variant="secondary" className="flex items-center gap-1">
                    {hobby}
                    <X size={12} className="cursor-pointer" onClick={() => removeHobby(hobby)} />
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {hobbyOptions.map((hobby) => (
                  <div key={hobby} className="flex items-center space-x-2">
                    <Checkbox
                      id={hobby}
                      checked={(profile.hobbies || []).includes(hobby)}
                      onCheckedChange={() => toggleArrayValue(profile.hobbies || [], hobby, 'hobbies')}
                    />
                    <Label htmlFor={hobby} className="text-sm">{hobby}</Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom hobby"
                  value={customHobby}
                  onChange={(e) => setCustomHobby(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomHobby())}
                />
                <Button type="button" onClick={addCustomHobby} size="sm">Add</Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Availability</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {availabilityOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={(profile.availability || []).includes(option.value)}
                    onCheckedChange={() => toggleArrayValue(profile.availability || [], option.value, 'availability')}
                  />
                  <Label htmlFor={option.value} className="text-sm">{option.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Social Preferences</CardTitle>
          <CardDescription>Set your preferences for connecting with other golfers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mentoring_interest">Mentoring Interest</Label>
            <Select value={watchedValues.mentoring_interest ?? ''} onValueChange={(value) => setValue('mentoring_interest', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mentoring preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not interested</SelectItem>
                <SelectItem value="mentor">I'd like to mentor others</SelectItem>
                <SelectItem value="mentee">I'd like to find a mentor</SelectItem>
                <SelectItem value="both">Both mentor and learn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open_to_matches"
                checked={!!watchedValues.open_to_matches}
                onCheckedChange={(checked) => setValue('open_to_matches', !!checked)}
              />
              <Label htmlFor="open_to_matches">Open to playing with new people</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="group_play_interest"
                checked={!!watchedValues.group_play_interest}
                onCheckedChange={(checked) => setValue('group_play_interest', !!checked)}
              />
              <Label htmlFor="group_play_interest">Interested in group play events</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="competitive_play_interest"
                checked={watchedValues.competitive_play_interest}
                onCheckedChange={(checked) => setValue('competitive_play_interest', checked as boolean)}
              />
              <Label htmlFor="competitive_play_interest">Interested in competitive play</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control what information is visible to other users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="profile_visibility">Profile Visibility</Label>
            <Select value={watchedValues.profile_visibility} onValueChange={(value) => setValue('profile_visibility', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can see my profile</SelectItem>
                <SelectItem value="friends">Friends only - Only connected friends</SelectItem>
                <SelectItem value="private">Private - Only me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_handicap"
                checked={watchedValues.show_handicap}
                onCheckedChange={(checked) => setValue('show_handicap', checked as boolean)}
              />
              <Label htmlFor="show_handicap">Show handicap to others</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_location"
                checked={watchedValues.show_location}
                onCheckedChange={(checked) => setValue('show_location', checked as boolean)}
              />
              <Label htmlFor="show_location">Show location to others</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_contact_info"
                checked={watchedValues.show_contact_info}
                onCheckedChange={(checked) => setValue('show_contact_info', checked as boolean)}
              />
              <Label htmlFor="show_contact_info">Show contact information to others</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Profile
      </Button>
    </form>
  );
}