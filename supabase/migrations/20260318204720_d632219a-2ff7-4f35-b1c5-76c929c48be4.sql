
-- Add logo_url column to empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their company logo
CREATE POLICY "Users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view company logos (public bucket)
CREATE POLICY "Public can view company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Allow users to update their own logos
CREATE POLICY "Users can update own company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own logos
CREATE POLICY "Users can delete own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
