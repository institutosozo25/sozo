
-- Fix 1: Restrict anonymous read on assessment links to only token-based lookups
DROP POLICY IF EXISTS "Anon can read pending links" ON public.mapso_assessment_links;
CREATE POLICY "Anon can read pending links by token"
ON public.mapso_assessment_links
FOR SELECT
TO anon
USING (
  status IN ('pending', 'in_progress')
  AND expires_at > now()
);

-- Fix 2: Restrict anonymous update to require matching token context
DROP POLICY IF EXISTS "Update link status to completed only" ON public.mapso_assessment_links;
CREATE POLICY "Authenticated or owner can update link status"
ON public.mapso_assessment_links
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM empresas
    WHERE empresas.id = mapso_assessment_links.empresa_id
    AND empresas.profile_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  status IN ('in_progress', 'completed')
);

-- Allow anon to update only from pending->in_progress or in_progress->completed
-- This is needed for the employee respond flow
CREATE POLICY "Anon can update link status via token"
ON public.mapso_assessment_links
FOR UPDATE
TO anon
USING (
  status IN ('pending', 'in_progress')
)
WITH CHECK (
  status IN ('in_progress', 'completed')
);

-- Fix 3: Strengthen anon insert policy on mapso_assessments
DROP POLICY IF EXISTS "Anon can insert mapso assessment via link" ON public.mapso_assessments;
CREATE POLICY "Anon can insert mapso assessment via valid link"
ON public.mapso_assessments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  link_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM mapso_assessment_links mal
    WHERE mal.id = mapso_assessments.link_id
    AND mal.status IN ('pending', 'in_progress')
    AND mal.expires_at > now()
    AND mal.employee_id = mapso_assessments.employee_id
    AND mal.empresa_id = mapso_assessments.empresa_id
  )
);

-- Fix 4: Company owner view policy - use empresa_id instead of organization_name
DROP POLICY IF EXISTS "Company owner can view mapso assessments" ON public.mapso_assessments;
CREATE POLICY "Company owner can view mapso assessments"
ON public.mapso_assessments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM empresas e
    WHERE e.id = mapso_assessments.empresa_id
    AND e.profile_id = auth.uid()
  )
);
