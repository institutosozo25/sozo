
-- FIX 1: test_submissions - add RESTRICTIVE policy to prevent cross-user access
CREATE POLICY "Deny all by default - restrictive baseline"
  ON public.test_submissions
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    (user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (
      paciente_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.pacientes p
        JOIN public.profissionais pr ON pr.id = p.profissional_id
        WHERE p.id = test_submissions.paciente_id
        AND pr.profile_id = auth.uid()
      )
    )
    OR (
      colaborador_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.colaboradores c
        JOIN public.empresas e ON e.id = c.empresa_id
        WHERE c.id = test_submissions.colaborador_id
        AND e.profile_id = auth.uid()
      )
    )
  );

-- FIX 2: profiles - add RESTRICTIVE policy to deny cross-user access
CREATE POLICY "Deny cross-user profile access - restrictive baseline"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    (id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- FIX 3: report_templates - add explicit SELECT policy for admins only
CREATE POLICY "Admins can view report templates"
  ON public.report_templates
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
