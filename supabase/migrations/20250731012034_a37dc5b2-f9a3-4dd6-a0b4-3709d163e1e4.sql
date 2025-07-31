-- Fix the storage SELECT policy for handicap-proofs
-- Drop the existing policy and recreate it with proper access control

DROP POLICY "Users can view handicap proofs" ON storage.objects;

-- Recreate the SELECT policy with proper user and admin access
CREATE POLICY "Users can view their own handicap proofs and admins can view all" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'handicap-proofs' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1] 
    OR public.has_role(auth.uid(), 'admin')
  )
);