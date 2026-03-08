
-- Fix 1: Restrict waitlist INSERT to require valid email and test_slug (not just TRUE)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "Anyone can join waitlist with valid data" ON public.waitlist
FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND length(trim(email)) > 5 
  AND email ~ '^[^@]+@[^@]+\.[^@]+$'
  AND test_slug IS NOT NULL 
  AND length(trim(test_slug)) > 0
);
