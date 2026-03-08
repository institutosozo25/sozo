
-- Fix privilege escalation: prevent non-admin users from creating admin invites
DROP POLICY IF EXISTS "Empresa or profissional can create invites" ON public.invites;
CREATE POLICY "Empresa or profissional can create invites"
ON public.invites
FOR INSERT
TO authenticated
WITH CHECK (
  invited_by = auth.uid()
  AND role IN ('user'::app_role, 'professional'::app_role, 'company'::app_role)
  AND (
    (empresa_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = invites.empresa_id AND empresas.profile_id = auth.uid()
    ))
    OR
    (profissional_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profissionais WHERE profissionais.id = invites.profissional_id AND profissionais.profile_id = auth.uid()
    ))
  )
);
