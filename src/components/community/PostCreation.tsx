import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  Trophy, 
  MapPin, 
  Send,
  Smile,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostCreationProps {
  onPostCreated?: () => void;
}

export const PostCreation = ({ onPostCreated }: PostCreationProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'achievement' | 'round_share'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          post_type: postType,
          visibility: 'public'
        });

      if (error) throw error;

      setContent('');
      setPostType('text');
      toast.success('Post shared with the community!');
      onPostCreated?.();
    } catch (error) {
      toast.error('Failed to create post. Please try again.');
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
            <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge 
                variant={postType === 'text' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setPostType('text')}
              >
                💬 <span className="hidden sm:inline">Share Thoughts</span><span className="sm:hidden">Thoughts</span>
              </Badge>
              <Badge 
                variant={postType === 'achievement' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setPostType('achievement')}
              >
                🏆 <span className="hidden sm:inline">Achievement</span><span className="sm:hidden">Achievement</span>
              </Badge>
              <Badge 
                variant={postType === 'round_share' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setPostType('round_share')}
              >
                ⛳ <span className="hidden sm:inline">Round Share</span><span className="sm:hidden">Round</span>
              </Badge>
            </div>

            <Textarea
              placeholder={
                postType === 'text' ? "What's on your mind about golf?" :
                postType === 'achievement' ? "Share your latest golf achievement!" :
                "Tell us about your recent round..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border-none shadow-none p-0 text-base placeholder:text-muted-foreground min-h-[60px]"
              rows={3}
            />

            <div className="flex items-center justify-between pt-2 border-t gap-2">
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Image className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 hidden sm:flex">
                  <Trophy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 hidden sm:flex">
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2 hidden sm:flex">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                size="sm"
                className="gap-2 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">{isSubmitting ? 'Posting...' : 'Post'}</span>
                <span className="sm:hidden">{isSubmitting ? '...' : 'Post'}</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};