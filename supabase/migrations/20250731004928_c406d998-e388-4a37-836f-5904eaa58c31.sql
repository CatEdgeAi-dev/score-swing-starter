-- Create storage bucket for handicap proof images
INSERT INTO storage.buckets (id, name, public) VALUES ('handicap-proofs', 'handicap-proofs', true);

-- Create policies for handicap proof uploads
CREATE POLICY "Users can view handicap proofs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'handicap-proofs');

CREATE POLICY "Users can upload their own handicap proofs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'handicap-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own handicap proofs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'handicap-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own handicap proofs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'handicap-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);