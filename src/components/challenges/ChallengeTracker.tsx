import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Target, Trophy, Clock, BarChart3, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_metric: string;
  target_value: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  reward_description: string | null;
}

export const ChallengeTracker = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveChallenges();
  }, []);

  const fetchActiveChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from("community_challenges")
        .select("*")
        .eq("is_active", true)
        .order("end_date", { ascending: true });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case 'weekly':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'monthly':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'seasonal':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const calculateProgress = (challenge: Challenge) => {
    // This would typically calculate actual progress based on user data
    // For now, we'll return a simulated progress value
    return Math.floor(Math.random() * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const joinChallenge = async (challengeId: string) => {
    toast({
      title: "Challenge Joined!",
      description: "You're now participating in this challenge",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="w-48 h-5 bg-muted rounded mb-2"></div>
                <div className="w-full h-3 bg-muted rounded mb-2"></div>
                <div className="w-24 h-4 bg-muted rounded"></div>
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
      <CardContent>
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const progress = calculateProgress(challenge);
            const daysRemaining = getDaysRemaining(challenge.end_date);
            
            return (
              <div key={challenge.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <Badge 
                        variant="outline" 
                        className={getChallengeTypeColor(challenge.challenge_type)}
                      >
                        {challenge.challenge_type}
                      </Badge>
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {challenge.description}
                      </p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => joinChallenge(challenge.id)}>
                    Join
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {daysRemaining === 0 ? 'Ends today' : `${daysRemaining} days left`}
                    </span>
                  </div>
                  {challenge.reward_description && (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      <span>{challenge.reward_description}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  {challenge.target_value && (
                    <span>Target: {challenge.target_value} {challenge.target_metric}</span>
                  )}
                </div>
              </div>
            );
          })}

          {challenges.length === 0 && (
            <div className="text-center py-12 space-y-4 text-muted-foreground">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Active Challenges</h3>
                <p className="text-sm">Challenges help you improve specific aspects of your game</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/stats?tab=stats')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  View My Stats
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/stats?tab=leaderboards')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Check Leaderboards
                </Button>
              </div>
              <p className="text-xs">Check back later for new challenges!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};