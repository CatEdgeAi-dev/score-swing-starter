-- Add handicap fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN whs_index DECIMAL(4,1) CHECK (whs_index >= 0.0 AND whs_index <= 54.0),
ADD COLUMN handicap_proof_url TEXT,
ADD COLUMN handicap_updated_at TIMESTAMP WITH TIME ZONE;