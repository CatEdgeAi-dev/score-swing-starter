import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Star, Target, TrendingUp, BarChart3, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Achievement {
  id: string;
  achievement_name: string;
  description: string | null;
  achievement_type: string;
  earned_at: string;
  is_featured: boolean;
  metadata: any;
}

export const AchievementsBadges = ({ userId }: { userId?: string }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      let query = supabase
        .from("user_achievements")
        .select("*")
        .order("earned_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'score':
        return <Target className="h-4 w-4" />;
      case 'improvement':
        return <TrendingUp className="h-4 w-4" />;
      case 'milestone':
        return <Star className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'score':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'improvement':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'milestone':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center p-4 border rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full mb-2"></div>
                <div className="w-20 h-4 bg-muted rounded mb-1"></div>
                <div className="w-16 h-3 bg-muted rounded"></div>
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
          <Award className="h-5 w-5" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-12 space-y-4 text-muted-foreground">
            <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No Achievements Yet</h3>
              <p className="text-sm">Start playing to unlock your first achievements</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/scorecard')}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Play a Round
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/stats?tab=challenges')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                View Challenges
              </Button>
            </div>
            <p className="text-xs">Achievements unlock based on your performance and milestones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex flex-col items-center p-4 border rounded-lg transition-all hover:shadow-md ${
                  achievement.is_featured ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${getAchievementColor(achievement.achievement_type)}`}>
                  {getAchievementIcon(achievement.achievement_type)}
                </div>
                <h3 className="font-semibold text-center mb-1">
                  {achievement.achievement_name}
                </h3>
                {achievement.description && (
                  <p className="text-sm text-muted-foreground text-center mb-2">
                    {achievement.description}
                  </p>
                )}
                <Badge variant="outline" className="text-xs">
                  {new Date(achievement.earned_at).toLocaleDateString()}
                </Badge>
                {achievement.is_featured && (
                  <Star className="h-4 w-4 text-yellow-500 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};