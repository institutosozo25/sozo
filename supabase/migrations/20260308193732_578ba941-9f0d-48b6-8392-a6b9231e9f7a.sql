
-- 1. Add INSERT policy for generated_reports so authenticated users can save their own reports
CREATE POLICY "Authenticated users can insert reports for own submissions"
ON public.generated_reports
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.test_submissions ts
    WHERE ts.id = generated_reports.submission_id
    AND ts.user_id = auth.uid()
  )
);

-- 2. Add UPDATE policy for test_submissions so users can update their own submissions (for payment_status etc.)
CREATE POLICY "Users can update own submissions"
ON public.test_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
