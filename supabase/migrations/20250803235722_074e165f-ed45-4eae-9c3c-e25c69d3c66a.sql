-- Epic 3: Community Database Schema Implementation

-- 1. Communities/Clubs table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  community_type TEXT NOT NULL DEFAULT 'club', -- 'club', 'league', 'tournament_series'
  location TEXT,
  course_affiliation TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  member_limit INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  rules_description TEXT,
  skill_level_requirement TEXT, -- 'any', 'beginner', 'intermediate', 'advanced'
  handicap_requirement_min NUMERIC,
  handicap_requirement_max NUMERIC
);

-- Enable RLS on communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Communities are viewable by everyone" 
ON public.communities 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create communities" 
ON public.communities 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Community creators can update their communities" 
ON public.communities 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Community creators can delete their communities" 
ON public.communities 
FOR DELETE 
USING (created_by = auth.uid());

-- 2. Community members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending', 'banned'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID,
  notes TEXT,
  UNIQUE(community_id, user_id)
);

-- Enable RLS on community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Community members policies
CREATE POLICY "Community members can view community membership" 
ON public.community_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = community_members.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'active'
  )
);

CREATE POLICY "Community admins can manage members" 
ON public.community_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = community_members.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('admin', 'moderator')
    AND cm.status = 'active'
  )
);

CREATE POLICY "Users can join communities" 
ON public.community_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- 3. Community events table
CREATE TABLE public.community_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'tournament', -- 'tournament', 'casual_round', 'social', 'lesson'
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  course_name TEXT,
  max_participants INTEGER,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  entry_fee NUMERIC DEFAULT 0,
  prize_description TEXT,
  format_description TEXT, -- stroke play, match play, scramble, etc.
  handicap_requirement_min NUMERIC,
  handicap_requirement_max NUMERIC,
  skill_level_requirement TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'upcoming' -- 'upcoming', 'ongoing', 'completed', 'cancelled'
);

-- Enable RLS on community_events
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Community events policies
CREATE POLICY "Community members can view events" 
ON public.community_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = community_events.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'active'
  )
);

CREATE POLICY "Community admins can create events" 
ON public.community_events 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = community_events.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('admin', 'moderator')
    AND cm.status = 'active'
  )
);

CREATE POLICY "Event creators and community admins can update events" 
ON public.community_events 
FOR UPDATE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = community_events.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('admin', 'moderator')
    AND cm.status = 'active'
  )
);

-- 4. Event participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered', -- 'registered', 'waitlist', 'cancelled', 'no_show'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  notes TEXT,
  handicap_at_registration NUMERIC,
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Event participants policies
CREATE POLICY "Community members can view event participants" 
ON public.event_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_events ce
    JOIN public.community_members cm ON cm.community_id = ce.community_id
    WHERE ce.id = event_participants.event_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'active'
  )
);

CREATE POLICY "Users can register for events" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own registration" 
ON public.event_participants 
FOR UPDATE 
USING (user_id = auth.uid());

-- 5. Match preferences table
CREATE TABLE public.match_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_skill_levels TEXT[] DEFAULT ARRAY['any'],
  preferred_age_ranges TEXT[] DEFAULT ARRAY['any'],
  preferred_playing_times TEXT[] DEFAULT ARRAY['morning', 'afternoon'],
  max_travel_distance INTEGER DEFAULT 50, -- in miles/km
  preferred_game_types TEXT[] DEFAULT ARRAY['stroke_play'], -- stroke_play, match_play, scramble
  preferred_group_size INTEGER DEFAULT 4,
  handicap_range_preference TEXT DEFAULT 'similar', -- 'any', 'similar', 'lower', 'higher'
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on match_preferences
ALTER TABLE public.match_preferences ENABLE ROW LEVEL SECURITY;

-- Match preferences policies
CREATE POLICY "Users can view all match preferences" 
ON public.match_preferences 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own match preferences" 
ON public.match_preferences 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Community rankings table
CREATE TABLE public.community_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL,
  user_id UUID NOT NULL,
  ranking_type TEXT NOT NULL DEFAULT 'overall', -- 'overall', 'monthly', 'tournament'
  rank_position INTEGER NOT NULL,
  points NUMERIC DEFAULT 0,
  events_played INTEGER DEFAULT 0,
  best_score INTEGER,
  average_score NUMERIC,
  period_start DATE,
  period_end DATE,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id, ranking_type, period_start)
);

-- Enable RLS on community_rankings
ALTER TABLE public.community_rankings ENABLE ROW LEVEL SECURITY;

-- Community rankings policies
CREATE POLICY "Community members can view rankings" 
ON public.community_rankings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = community_rankings.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.status = 'active'
  )
);

-- 7. User follows table (social connections)
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- User follows policies
CREATE POLICY "Users can view follows" 
ON public.user_follows 
FOR SELECT 
USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can follow others" 
ON public.user_follows 
FOR INSERT 
WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow others" 
ON public.user_follows 
FOR DELETE 
USING (follower_id = auth.uid());

-- Add triggers for updated_at columns
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_events_updated_at
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_preferences_updated_at
  BEFORE UPDATE ON public.match_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX idx_community_events_community_id ON public.community_events(community_id);
CREATE INDEX idx_community_events_start_date ON public.community_events(start_date);
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX idx_community_rankings_community_id ON public.community_rankings(community_id);
CREATE INDEX idx_community_rankings_ranking_type ON public.community_rankings(ranking_type);
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);