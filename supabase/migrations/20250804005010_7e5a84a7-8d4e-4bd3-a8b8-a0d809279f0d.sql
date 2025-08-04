-- Add foreign key constraint to community_rankings table
ALTER TABLE public.community_rankings 
ADD CONSTRAINT community_rankings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_community_rankings_user_id ON public.community_rankings(user_id);

-- Also ensure we have some sample data for testing
INSERT INTO public.community_rankings (
  community_id,
  user_id,
  ranking_type,
  rank_position,
  points,
  events_played,
  best_score,
  average_score,
  period_start,
  period_end,
  last_updated
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users LIMIT 1),
  'overall',
  1,
  1500,
  5,
  72,
  85.5,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert a few more sample entries if there are more users
INSERT INTO public.community_rankings (
  community_id,
  user_id,
  ranking_type,
  rank_position,
  points,
  events_played,
  best_score,
  average_score,
  period_start,
  period_end,
  last_updated
)
SELECT 
  gen_random_uuid(),
  id,
  'overall',
  ROW_NUMBER() OVER (ORDER BY RANDOM()) + 1,
  1000 + (RANDOM() * 1000)::integer,
  (RANDOM() * 10)::integer + 1,
  70 + (RANDOM() * 20)::integer,
  75 + (RANDOM() * 25),
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  NOW()
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.community_rankings WHERE ranking_type = 'overall')
LIMIT 10;