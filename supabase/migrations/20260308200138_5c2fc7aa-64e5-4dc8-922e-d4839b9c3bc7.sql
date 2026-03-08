
-- Tighten generated_reports: prevent UPDATE/DELETE by non-admins
CREATE POLICY "Users cannot update reports"
ON public.generated_reports
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Users cannot delete reports"
ON public.generated_reports
FOR DELETE
TO authenticated
USING (false);

-- Tighten test_submissions: restrict UPDATE to only specific safe columns via trigger
-- Add policy to prevent users from unlocking their own results
CREATE OR REPLACE FUNCTION public.prevent_manual_unlock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only service_role can set test_result_unlocked or paid to true
  IF NEW.test_result_unlocked = true AND OLD.test_result_unlocked = false THEN
    IF current_setting('role') != 'service_role' THEN
      RAISE EXCEPTION 'Cannot manually unlock results';
    END IF;
  END IF;
  IF NEW.paid = true AND OLD.paid = false THEN
    IF current_setting('role') != 'service_role' THEN
      RAISE EXCEPTION 'Cannot manually set paid status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_manual_unlock_trigger
BEFORE UPDATE ON public.test_submissions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_manual_unlock();

-- Add index for daily report limit queries
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON public.generated_reports (created_at);
CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id_status ON public.test_submissions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id_status ON public.payments (user_id, status);
