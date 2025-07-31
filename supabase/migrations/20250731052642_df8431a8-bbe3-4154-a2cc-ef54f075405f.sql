-- Epic 1: Enhanced User Profiles - Database Schema Extension
-- Add community-related fields to the profiles table

-- Add golf preferences fields
ALTER TABLE public.profiles 
ADD COLUMN home_course TEXT,
ADD COLUMN preferred_tee_times TEXT[], -- Array for multiple preferred times like ['morning', 'afternoon', 'evening']
ADD COLUMN playing_frequency TEXT CHECK (playing_frequency IN ('weekly', 'bi-weekly', 'monthly', 'occasionally')),
ADD COLUMN favorite_course_type TEXT CHECK (favorite_course_type IN ('links', 'parkland', 'desert', 'mountain', 'resort')),
ADD COLUMN golf_goals TEXT[], -- Array for multiple goals
ADD COLUMN experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional'));

-- Add lifestyle interests fields  
ALTER TABLE public.profiles
ADD COLUMN hobbies TEXT[], -- Array of hobbies
ADD COLUMN age_range TEXT CHECK (age_range IN ('18-25', '26-35', '36-45', '46-55', '56-65', '65+')),
ADD COLUMN location TEXT,
ADD COLUMN occupation TEXT,
ADD COLUMN availability TEXT[] CHECK (array_length(availability, 1) IS NULL OR availability <@ ARRAY['weekday_morning', 'weekday_afternoon', 'weekday_evening', 'weekend_morning', 'weekend_afternoon', 'weekend_evening']);

-- Add social preferences fields
ALTER TABLE public.profiles  
ADD COLUMN open_to_matches BOOLEAN DEFAULT true,
ADD COLUMN mentoring_interest TEXT CHECK (mentoring_interest IN ('mentor', 'mentee', 'both', 'none')) DEFAULT 'none',
ADD COLUMN group_play_interest BOOLEAN DEFAULT true,
ADD COLUMN competitive_play_interest BOOLEAN DEFAULT false;

-- Add profile completion and privacy fields
ALTER TABLE public.profiles
ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
ADD COLUMN profile_visibility TEXT CHECK (profile_visibility IN ('public', 'friends', 'private')) DEFAULT 'public',
ADD COLUMN show_handicap BOOLEAN DEFAULT true,
ADD COLUMN show_location BOOLEAN DEFAULT true,
ADD COLUMN show_contact_info BOOLEAN DEFAULT false;

-- Add community onboarding tracking
ALTER TABLE public.profiles
ADD COLUMN community_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN community_onboarding_step INTEGER DEFAULT 0;

-- Create function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    completion_score integer := 0;
    total_fields integer := 15; -- Total number of profile fields to check
BEGIN
    SELECT 
        CASE WHEN display_name IS NOT NULL AND length(trim(display_name)) > 0 THEN 1 ELSE 0 END +
        CASE WHEN whs_index IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN home_course IS NOT NULL AND length(trim(home_course)) > 0 THEN 1 ELSE 0 END +
        CASE WHEN preferred_tee_times IS NOT NULL AND array_length(preferred_tee_times, 1) > 0 THEN 1 ELSE 0 END +
        CASE WHEN playing_frequency IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN favorite_course_type IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN golf_goals IS NOT NULL AND array_length(golf_goals, 1) > 0 THEN 1 ELSE 0 END +
        CASE WHEN experience_level IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN hobbies IS NOT NULL AND array_length(hobbies, 1) > 0 THEN 1 ELSE 0 END +
        CASE WHEN age_range IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN location IS NOT NULL AND length(trim(location)) > 0 THEN 1 ELSE 0 END +
        CASE WHEN occupation IS NOT NULL AND length(trim(occupation)) > 0 THEN 1 ELSE 0 END +
        CASE WHEN availability IS NOT NULL AND array_length(availability, 1) > 0 THEN 1 ELSE 0 END +
        CASE WHEN mentoring_interest IS NOT NULL AND mentoring_interest != 'none' THEN 1 ELSE 0 END +
        CASE WHEN open_to_matches IS NOT NULL THEN 1 ELSE 0 END
    INTO completion_score
    FROM public.profiles 
    WHERE id = profile_id;
    
    -- Calculate percentage
    RETURN ROUND((completion_score::decimal / total_fields::decimal) * 100);
END;
$$;

-- Create trigger to automatically update profile completion percentage
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.profile_completion_percentage := public.calculate_profile_completion(NEW.id);
    RETURN NEW;
END;
$$;

-- Create trigger for profile completion updates
CREATE TRIGGER trigger_update_profile_completion
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_completion();