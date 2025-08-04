import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalLeaderboard } from "@/components/leaderboards/GlobalLeaderboard";
import { AchievementsBadges } from "@/components/achievements/AchievementsBadges";
import { HandicapProgress } from "@/components/progress/HandicapProgress";
import { ChallengeTracker } from "@/components/challenges/ChallengeTracker";

const Leaderboards = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leaderboards & Progress</h1>
        <p className="text-muted-foreground">
          Track your progress, compete with others, and unlock achievements
        </p>
      </div>

      <Tabs defaultValue="leaderboards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboards" className="space-y-6">
          <GlobalLeaderboard />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <AchievementsBadges />
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <HandicapProgress />
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6">
          <ChallengeTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboards;