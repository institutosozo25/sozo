
-- Fix overly permissive INSERT on submission_answers: require authenticated user
DROP POLICY IF EXISTS "Anyone can create answers" ON public.submission_answers;
CREATE POLICY "Authenticated users can create answers"
ON public.submission_answers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_submissions ts
    WHERE ts.id = submission_answers.submission_id
    AND ts.user_id = auth.uid()
  )
);

-- Fix overly permissive INSERT on test_submissions: require authenticated user
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.test_submissions;
CREATE POLICY "Authenticated users can create submissions"
ON public.test_submissions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- profiles INSERT is used by the handle_new_user trigger (SECURITY DEFINER) so it's safe,
-- but let's tighten it to only allow the trigger or the user themselves
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System or self can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());
