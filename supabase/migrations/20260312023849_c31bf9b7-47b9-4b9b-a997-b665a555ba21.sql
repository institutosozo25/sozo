
-- Tighten the permissive update policy on mapso_assessment_links
DROP POLICY IF EXISTS "Anyone can update link status" ON public.mapso_assessment_links;
CREATE POLICY "Update link status to completed only"
  ON public.mapso_assessment_links FOR UPDATE TO anon, authenticated
  USING (status = 'pending' OR status = 'in_progress')
  WITH CHECK (status IN ('in_progress', 'completed'));

-- Tighten the SELECT policy - only allow reading by specific token
DROP POLICY IF EXISTS "Anyone can read link by token" ON public.mapso_assessment_links;
CREATE POLICY "Anon can read pending links"
  ON public.mapso_assessment_links FOR SELECT TO anon
  USING (status IN ('pending', 'in_progress'));
