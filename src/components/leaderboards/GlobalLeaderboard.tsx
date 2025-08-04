import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  rank_position: number;
  points: number;
  best_score: number | null;
  average_score: number | null;
  events_played: number;
  profiles: {
    display_name: string | null;
    whs_index: number | null;
  } | null;
}

export const GlobalLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("community_rankings")
        .select(`
          *,
          profiles:user_id (
            display_name,
            whs_index
          )
        `)
        .eq("ranking_type", "overall")
        .order("rank_position", { ascending: true })
        .limit(50);

      if (error) throw error;
      setLeaderboard((data as any) || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-semibold">#{position}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded"></div>
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="w-32 h-4 bg-muted rounded"></div>
                  <div className="w-24 h-3 bg-muted rounded mt-1"></div>
                </div>
                <div className="w-16 h-4 bg-muted rounded"></div>
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
          <Trophy className="h-5 w-5" />
          Global Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 flex justify-center">
                  {getRankIcon(entry.rank_position)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {entry.profiles?.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{entry.profiles?.display_name || "Unknown"}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>HCP: {entry.profiles?.whs_index || "N/A"}</span>
                    <span>•</span>
                    <span>{entry.events_played} events</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{entry.points} pts</div>
                <div className="text-sm text-muted-foreground">
                  Avg: {entry.average_score || "N/A"}
                </div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rankings available yet</p>
              <p className="text-sm">Play some rounds to see leaderboards!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};