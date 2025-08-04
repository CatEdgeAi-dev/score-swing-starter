import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Hash, 
  MessageCircle,
  Eye
} from 'lucide-react';

const trendingTopics = [
  {
    id: 1,
    tag: 'ParadiseValley',
    posts: 23,
    trend: 'up'
  },
  {
    id: 2,
    tag: 'HandicapImprovement',
    posts: 18,
    trend: 'up'
  },
  {
    id: 3,
    tag: 'WeekendWarriors',
    posts: 15,
    trend: 'stable'
  },
  {
    id: 4,
    tag: 'NewEquipment',
    posts: 12,
    trend: 'up'
  },
  {
    id: 5,
    tag: 'PuttingTips',
    posts: 9,
    trend: 'down'
  }
];

const recentDiscussions = [
  {
    id: 1,
    title: 'Best way to improve short game?',
    replies: 8,
    views: 45
  },
  {
    id: 2,
    title: 'Course conditions at Pebble Beach',
    replies: 12,
    views: 67
  },
  {
    id: 3,
    title: 'Breaking 80 for the first time!',
    replies: 15,
    views: 89
  }
];

export const TrendingTopics = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingTopics.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium">#{topic.tag}</span>
                {topic.trend === 'up' && (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                {topic.posts}
              </Badge>
            </div>
          ))}
          
          <Button variant="ghost" className="w-full text-xs mt-3">
            View All Topics
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Hot Discussions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentDiscussions.map((discussion) => (
            <div key={discussion.id} className="space-y-1">
              <h4 className="text-sm font-medium line-clamp-2">
                {discussion.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{discussion.replies}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{discussion.views}</span>
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="ghost" className="w-full text-xs mt-3">
            View All Discussions
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};