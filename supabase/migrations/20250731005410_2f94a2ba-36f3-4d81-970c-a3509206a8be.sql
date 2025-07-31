-- Add review workflow fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN handicap_status TEXT DEFAULT 'none' CHECK (handicap_status IN ('none', 'pending', 'approved', 'rejected')),
ADD COLUMN handicap_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN handicap_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN handicap_reviewed_by UUID,
ADD COLUMN handicap_rejection_reason TEXT;

-- Create handicap submissions table for tracking review workflow
CREATE TABLE public.handicap_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  whs_index DECIMAL(4,1) NOT NULL CHECK (whs_index >= 0.0 AND whs_index <= 54.0),
  proof_image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on handicap submissions
ALTER TABLE public.handicap_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for handicap submissions
CREATE POLICY "Users can view their own submissions" 
ON public.handicap_submissions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own submissions" 
ON public.handicap_submissions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at on handicap_submissions
CREATE TRIGGER update_handicap_submissions_updated_at
BEFORE UPDATE ON public.handicap_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user roles enum and table for admin access
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'support');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Admin/support policies for handicap submissions
CREATE POLICY "Admins and support can view all submissions" 
ON public.handicap_submissions 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'support')
);

CREATE POLICY "Admins and support can update submissions" 
ON public.handicap_submissions 
FOR UPDATE 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'support')
);

-- Policy for user_roles (only admins can manage roles)
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());