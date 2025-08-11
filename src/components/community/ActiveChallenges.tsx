import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Trophy, 
  Calendar, 
  Users,
  TrendingUp,
  Gift
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_metric: string;
  target_value: number;
  start_date: string;
  end_date: string;
  reward_description: string;
}

export const ActiveChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error) throw error;
      const normalized: Challenge[] = (data || []).map((c: any) => ({
        id: c.id,
        title: c.title || '',
        description: c.description ?? '',
        challenge_type: c.challenge_type || 'general',
        target_metric: c.target_metric || '',
        target_value: c.target_value ?? 0,
        start_date: c.start_date,
        end_date: c.end_date,
        reward_description: c.reward_description ?? ''
      }));
      setChallenges(normalized);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'weekly':
        return <Calendar className="h-5 w-5" />;
      case 'monthly':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getProgressPercentage = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Active Challenges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.length === 0 ? (
          <div className="text-center py-6">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active challenges right now</p>
            <p className="text-sm text-muted-foreground">Check back soon for new challenges!</p>
          </div>
        ) : (
          challenges.map((challenge) => {
            const progress = getProgressPercentage(challenge.start_date, challenge.end_date);
            const daysLeft = getDaysRemaining(challenge.end_date);
            
            return (
              <div key={challenge.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getChallengeIcon(challenge.challenge_type)}
                    <div>
                      <h3 className="font-semibold text-sm">{challenge.title}</h3>
                      <p className="text-xs text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {challenge.challenge_type}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{daysLeft} days left</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Gift className="h-3 w-3" />
                    <span>{challenge.reward_description}</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Join Challenge
                  </Button>
                </div>
              </div>
            );
          })
        )}
        
        <div className="pt-4 border-t">
          <Button variant="ghost" className="w-full text-sm">
            <Users className="h-4 w-4 mr-2" />
            View All Community Challenges
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};