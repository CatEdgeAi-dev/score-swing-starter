-- Fix security warnings by setting search_path for functions

-- Update calculate_profile_completion function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Update update_profile_completion function with proper search_path
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.profile_completion_percentage := public.calculate_profile_completion(NEW.id);
    RETURN NEW;
END;
$$;