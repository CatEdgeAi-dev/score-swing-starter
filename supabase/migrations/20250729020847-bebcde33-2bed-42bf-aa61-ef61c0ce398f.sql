-- First, let's check what foreign keys exist on the rounds table
-- We need to update the rounds table to reference profiles instead of auth.users directly

-- Add a foreign key relationship from rounds to profiles
-- Since rounds.user_id currently references auth.users, and profiles.id also references auth.users,
-- we can create a proper relationship

-- Drop the existing foreign key constraint if it exists (to auth.users)
-- Note: We need to be careful here to not break existing data

-- Let's create a view or update the query approach instead
-- First, let's see the current rounds table structure