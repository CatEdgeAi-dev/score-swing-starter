-- Since both rounds.user_id and profiles.id reference auth.users(id),
-- we can create a proper join by using the user_id column to link to profiles
-- But first we need to ensure the query works correctly

-- For now, let's use a different approach and query profiles separately
-- or use a manual join in the query

-- Let's test if we can query profiles directly first to make sure the table is working
SELECT COUNT(*) FROM public.profiles;