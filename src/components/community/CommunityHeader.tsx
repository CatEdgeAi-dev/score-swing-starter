import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare, Trophy, Sparkles } from 'lucide-react';

export const CommunityHeader = () => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Golf Community
            </h1>
            <p className="text-muted-foreground">
              Connect with fellow golfers, share your rounds, and challenge yourself
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-semibold">1.2k</span>
              </div>
              <span className="text-xs text-muted-foreground">Posts</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold">847</span>
              </div>
              <span className="text-xs text-muted-foreground">Members</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="font-semibold">23</span>
              </div>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            New Challenge: Par Paradise
          </Badge>
          <Badge variant="secondary" className="text-xs">Weekly Leaderboard Reset</Badge>
        </div>
      </CardContent>
    </Card>
  );
};