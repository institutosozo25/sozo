
-- Test history table for storing PDF links and test records
CREATE TABLE public.test_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_type TEXT NOT NULL,
  test_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pdf_diagnostic_path TEXT,
  pdf_report_path TEXT,
  pdf_action_plan_path TEXT,
  drive_diagnostic_id TEXT,
  drive_report_id TEXT,
  drive_action_plan_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;

-- Users can view own history
CREATE POLICY "Users can view own test history"
ON public.test_history FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert own history
CREATE POLICY "Users can insert own test history"
ON public.test_history FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can manage all history
CREATE POLICY "Admins can manage all test history"
ON public.test_history FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast user lookups
CREATE INDEX idx_test_history_user_id ON public.test_history(user_id);
CREATE INDEX idx_test_history_completed_at ON public.test_history(user_id, completed_at DESC);

-- Create storage bucket for test PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('test-pdfs', 'test-pdfs', false, 10485760, ARRAY['application/pdf']);

-- Storage policies: users can read own PDFs
CREATE POLICY "Users can read own PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'test-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can upload own PDFs
CREATE POLICY "Users can upload own PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'test-pdfs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can manage all PDFs
CREATE POLICY "Admins can manage all test PDFs"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'test-pdfs' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'test-pdfs' AND public.has_role(auth.uid(), 'admin'));
