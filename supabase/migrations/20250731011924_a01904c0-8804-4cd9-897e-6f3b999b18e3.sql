-- Create storage policies for handicap-proofs bucket
-- Allow users to upload their own handicap proof images

-- Policy for inserting (uploading) files
CREATE POLICY "Users can upload their own handicap proofs" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'handicap-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for selecting (viewing) files
CREATE POLICY "Users can view their own handicap proofs" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'handicap-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for updating files
CREATE POLICY "Users can update their own handicap proofs" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'handicap-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for deleting files
CREATE POLICY "Users can delete their own handicap proofs" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'handicap-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admin users to view all handicap proof files for review purposes
CREATE POLICY "Admins can view all handicap proofs" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'handicap-proofs' 
  AND public.has_role(auth.uid(), 'admin')
);