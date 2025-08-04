-- Epic 4: Community Feed Database Schema

-- 1. Community posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'achievement', 'round_share'
  image_url TEXT,
  metadata JSONB, -- For storing additional data like achievement details, round info, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'public' -- 'public', 'friends', 'community'
);

-- Enable RLS on community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Community posts policies
CREATE POLICY "Users can view public posts" 
ON public.community_posts 
FOR SELECT 
USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create their own posts" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts" 
ON public.community_posts 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts" 
ON public.community_posts 
FOR DELETE 
USING (user_id = auth.uid());

-- 2. Post interactions table (likes, comments, shares)
CREATE TABLE public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL, -- 'like', 'comment', 'share'
  content TEXT, -- For comments
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, interaction_type, content) -- Prevent duplicate likes, allow multiple comments
);

-- Enable RLS on post_interactions
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- Post interactions policies
CREATE POLICY "Users can view interactions on visible posts" 
ON public.post_interactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_posts cp 
    WHERE cp.id = post_interactions.post_id 
    AND (cp.visibility = 'public' OR cp.user_id = auth.uid())
  )
);

CREATE POLICY "Users can create interactions" 
ON public.post_interactions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interactions" 
ON public.post_interactions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own interactions" 
ON public.post_interactions 
FOR DELETE 
USING (user_id = auth.uid());

-- 3. Community challenges table
CREATE TABLE public.community_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'special'
  target_metric TEXT NOT NULL, -- 'rounds_played', 'handicap_improvement', 'course_variety'
  target_value NUMERIC,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reward_description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on community_challenges
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;

-- Community challenges policies
CREATE POLICY "Everyone can view active challenges" 
ON public.community_challenges 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage challenges" 
ON public.community_challenges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. User achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL, -- 'handicap_milestone', 'rounds_milestone', 'course_explorer', 'social_star'
  achievement_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  challenge_id UUID, -- Reference to community_challenges if earned through challenge
  metadata JSONB, -- Additional achievement data
  is_featured BOOLEAN NOT NULL DEFAULT false -- Featured achievements show prominently
);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- User achievements policies
CREATE POLICY "Users can view all achievements" 
ON public.user_achievements 
FOR SELECT 
USING (true);

CREATE POLICY "System can create achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true); -- Achievements created by system/triggers

-- Add triggers for updated_at columns
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_challenges_updated_at
  BEFORE UPDATE ON public.community_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_post_type ON public.community_posts(post_type);
CREATE INDEX idx_post_interactions_post_id ON public.post_interactions(post_id);
CREATE INDEX idx_post_interactions_user_id ON public.post_interactions(user_id);
CREATE INDEX idx_post_interactions_type ON public.post_interactions(interaction_type);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON public.user_achievements(achievement_type);
CREATE INDEX idx_community_challenges_active ON public.community_challenges(is_active, start_date, end_date);

-- Enable realtime for community posts and interactions
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_interactions REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_interactions;