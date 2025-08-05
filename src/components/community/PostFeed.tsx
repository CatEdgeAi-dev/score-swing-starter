import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Trophy,
  MapPin,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
  } | null;
  _count?: {
    likes: number;
    comments: number;
  };
  hasLiked?: boolean;
  [key: string]: any; // Add index signature to handle additional properties
}

export const PostFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('community-posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'community_posts' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get interaction counts and user's likes for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase
              .from('post_interactions')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .eq('interaction_type', 'like'),
            supabase
              .from('post_interactions')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .eq('interaction_type', 'comment'),
            user ? supabase
              .from('post_interactions')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .eq('interaction_type', 'like')
              .maybeSingle() : Promise.resolve({ data: null })
          ]);

          return {
            ...post,
            _count: {
              likes: likesResult.count || 0,
              comments: commentsResult.count || 0
            },
            hasLiked: !!userLikeResult.data
          };
        })
      );

      setPosts(postsWithCounts as unknown as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.hasLiked) {
        // Unlike
        await supabase
          .from('post_interactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('interaction_type', 'like');
      } else {
        // Like
        await supabase
          .from('post_interactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            interaction_type: 'like'
          });
      }

      // Optimistically update the UI
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? {
              ...p,
              hasLiked: !p.hasLiked,
              _count: {
                ...p._count!,
                likes: p.hasLiked ? p._count!.likes - 1 : p._count!.likes + 1
              }
            }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'round_share':
        return <MapPin className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPostTypeBadge = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Badge variant="secondary" className="text-xs">🏆 Achievement</Badge>;
      case 'round_share':
        return <Badge variant="secondary" className="text-xs">⛳ Round</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            Be the first to share something with the community!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`} />
                <AvatarFallback>
                  {post.profiles?.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-semibold text-sm truncate">
                      {post.profiles?.display_name || 'Golf Enthusiast'}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {getPostTypeIcon(post.post_type)}
                      {getPostTypeBadge(post.post_type)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs hidden sm:inline">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    <span className="text-xs sm:hidden">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace(' ago', '')}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm mb-3 break-words">
                  <p className="whitespace-pre-wrap overflow-wrap-anywhere">
                    {post.content}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 gap-1 sm:gap-2 ${post.hasLiked ? 'text-red-500' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className={`h-4 w-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                    <span className="text-xs">{post._count?.likes || 0}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-8 gap-1 sm:gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{post._count?.comments || 0}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-8 gap-1 sm:gap-2">
                    <Share className="h-4 w-4" />
                    <span className="text-xs hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};