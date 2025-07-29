-- Create profile for existing users who don't have one yet
INSERT INTO public.profiles (id, display_name)
SELECT 
  id, 
  SPLIT_PART(email, '@', 1) as display_name
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);