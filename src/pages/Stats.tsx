import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Award,
  Activity
} from 'lucide-react';
import { useRounds } from '@/hooks/useRounds';
import { LoadingSpinner } from '@/components/scorecard/LoadingSpinner';

interface RoundData {
  id: string;
  course_name: string;
  date_played: string;
  total_score: number;
  total_putts: number;
  fairways_hit: number;
  greens_in_regulation: number;
  holes: Array<{
    hole_number: number;
    par: number;
    strokes: number;
    putts: number;
    fairway_hit: boolean;
    green_in_regulation: boolean;
  }>;
}

const Stats: React.FC = () => {
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchRounds } = useRounds();

  useEffect(() => {
    const loadRounds = async () => {
      setLoading(true);
      try {
        const roundData = await fetchRounds();
        // Transform the data to match our interface
        const transformedRounds = roundData.map(round => ({
          ...round,
          holes: (round as any).holes || []
        }));
        setRounds(transformedRounds as RoundData[]);
      } catch (error) {
        console.error('Error loading rounds:', error);
        setRounds([]);
      } finally {
        setLoading(false);
      }
    };

    loadRounds();
  }, []); // Remove fetchRounds from dependencies to prevent infinite loop

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Golf Statistics</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Statistics Available</h3>
              <p className="text-muted-foreground">
                Play some rounds to see your golf statistics and performance analytics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate overall statistics
  const totalRounds = rounds.length;
  const averageScore = rounds.reduce((sum, round) => sum + round.total_score, 0) / totalRounds;
  const bestScore = Math.min(...rounds.map(round => round.total_score));
  const averagePutts = rounds.reduce((sum, round) => sum + round.total_putts, 0) / totalRounds / 18;
  const averageGIR = rounds.reduce((sum, round) => sum + round.greens_in_regulation, 0) / totalRounds;
  const averageFairways = rounds.reduce((sum, round) => sum + round.fairways_hit, 0) / totalRounds;

  // Prepare chart data
  const recentRounds = rounds.slice(0, 10).reverse();
  const scoreProgressData = recentRounds.map((round, index) => ({
    round: `Round ${index + 1}`,
    score: round.total_score,
    par: 72,
    date: new Date(round.date_played).toLocaleDateString()
  }));

  const performanceData = [
    { name: 'GIR', value: averageGIR, total: 18, percentage: (averageGIR / 18) * 100 },
    { name: 'Fairways', value: averageFairways, total: 14, percentage: (averageFairways / 14) * 100 }
  ];

  const scoreDistribution = rounds.reduce((acc, round) => {
    const scoreVsPar = round.total_score - 72;
    let category = '';
    if (scoreVsPar <= -5) category = 'Under Par (5+)';
    else if (scoreVsPar <= -1) category = 'Under Par (1-4)';
    else if (scoreVsPar === 0) category = 'Even Par';
    else if (scoreVsPar <= 5) category = 'Over Par (1-5)';
    else if (scoreVsPar <= 10) category = 'Over Par (6-10)';
    else category = 'Over Par (10+)';
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(scoreDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626'];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Golf Statistics</h1>
          <p className="text-muted-foreground">
            Performance analytics from {totalRounds} round{totalRounds !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{bestScore}</div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{averageGIR.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg GIR</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{totalRounds}</div>
              <div className="text-sm text-muted-foreground">Total Rounds</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Score Progress</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Score Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Recent Score Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scoreProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="round" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [value, name === 'score' ? 'Score' : 'Par']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="par" fill="#e5e7eb" name="par" />
                    <Bar dataKey="score" fill="hsl(var(--primary))" name="score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceData.map((metric) => (
                    <div key={metric.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metric.name}</span>
                        <span>{metric.value.toFixed(1)}/{metric.total} ({metric.percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${metric.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Putts per Hole</span>
                      <span>{averagePutts.toFixed(2)}</span>
                    </div>
                    <Badge variant={averagePutts <= 1.8 ? "default" : averagePutts <= 2.2 ? "secondary" : "destructive"}>
                      {averagePutts <= 1.8 ? 'Excellent' : averagePutts <= 2.2 ? 'Good' : 'Needs Work'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Performance Rating</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      {((averageGIR / 18) * 0.4 + (averageFairways / 14) * 0.3 + (averagePutts <= 2 ? 1 : 0.5) * 0.3).toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Rating (out of 1.0)</div>
                    <Badge variant="outline">
                      {averageScore - 72 <= 5 ? 'Above Average' : averageScore - 72 <= 15 ? 'Average' : 'Improving'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Greens in Regulation:</span>
                      <span className="font-medium">{((averageGIR / 18) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fairway Accuracy:</span>
                      <span className="font-medium">{((averageFairways / 14) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Putting Average:</span>
                      <span className="font-medium">{averagePutts.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5" />
                  <span>Score Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Stats;