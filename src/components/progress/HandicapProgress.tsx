import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HandicapData {
  date: string;
  handicap: number;
  rounds_played: number;
}

export const HandicapProgress = ({ userId }: { userId?: string }) => {
  const [handicapData, setHandicapData] = useState<HandicapData[]>([]);
  const [currentHandicap, setCurrentHandicap] = useState<number | null>(null);
  const [trend, setTrend] = useState<'improving' | 'worsening' | 'stable'>('stable');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHandicapProgress();
    fetchCurrentHandicap();
  }, [userId]);

  const fetchCurrentHandicap = async () => {
    try {
      let query = supabase
        .from("profiles")
        .select("whs_index");

      if (userId) {
        query = query.eq("id", userId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq("id", user.id);
        }
      }

      const { data, error } = await query.single();

      if (error) throw error;
      setCurrentHandicap(data?.whs_index || null);
    } catch (error) {
      console.error("Error fetching current handicap:", error);
    }
  };

  const fetchHandicapProgress = async () => {
    try {
      // For now, we'll simulate handicap progression data
      // In a real implementation, you'd track handicap changes over time
      const simulatedData: HandicapData[] = [
        { date: "2024-01", handicap: 18.5, rounds_played: 5 },
        { date: "2024-02", handicap: 17.8, rounds_played: 8 },
        { date: "2024-03", handicap: 17.2, rounds_played: 6 },
        { date: "2024-04", handicap: 16.9, rounds_played: 7 },
        { date: "2024-05", handicap: 16.5, rounds_played: 9 },
        { date: "2024-06", handicap: 15.8, rounds_played: 10 },
      ];

      setHandicapData(simulatedData);

      // Calculate trend
      if (simulatedData.length >= 2) {
        const latest = simulatedData[simulatedData.length - 1].handicap;
        const previous = simulatedData[simulatedData.length - 2].handicap;
        const diff = latest - previous;
        
        if (diff < -0.5) setTrend('improving');
        else if (diff > 0.5) setTrend('worsening');
        else setTrend('stable');
      }
    } catch (error) {
      console.error("Error fetching handicap progress:", error);
      toast({
        title: "Error",
        description: "Failed to load handicap progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-5 w-5 text-green-600" />;
      case 'worsening':
        return <TrendingUp className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case 'improving':
        return 'Improving';
      case 'worsening':
        return 'Needs Work';
      default:
        return 'Stable';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Handicap Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
              <div className="w-20 h-6 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="w-full h-64 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Handicap Progress</span>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-normal">{getTrendText()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Handicap</p>
              <p className="text-2xl font-bold">
                {currentHandicap !== null ? currentHandicap.toFixed(1) : "Not Set"}
              </p>
            </div>
            {handicapData.length >= 2 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">6-Month Change</p>
                <p className={`text-lg font-semibold ${
                  trend === 'improving' ? 'text-green-600' : 
                  trend === 'worsening' ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {(handicapData[handicapData.length - 1].handicap - handicapData[0].handicap).toFixed(1)}
                </p>
              </div>
            )}
          </div>

          {handicapData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={handicapData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip 
                    formatter={(value: any) => [value.toFixed(1), 'Handicap']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="handicap" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {handicapData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No handicap history available</p>
              <p className="text-sm">Play more rounds to track your progress!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};