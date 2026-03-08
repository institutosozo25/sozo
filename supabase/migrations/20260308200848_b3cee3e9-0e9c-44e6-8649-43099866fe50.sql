
-- 1. Fix invite role escalation via UPDATE
DROP POLICY IF EXISTS "Invite creator can update" ON public.invites;
CREATE POLICY "Invite creator can update"
ON public.invites
FOR UPDATE
TO authenticated
USING (invited_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  (invited_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  AND role IN ('user'::app_role, 'professional'::app_role, 'company'::app_role)
);

-- 2. Fix payment bypass: restrict user UPDATE on test_submissions to safe columns only
DROP POLICY IF EXISTS "Users can update own submissions" ON public.test_submissions;
CREATE POLICY "Users can update own submissions safely"
ON public.test_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND paid = (SELECT paid FROM test_submissions WHERE id = test_submissions.id)
  AND test_result_unlocked = (SELECT test_result_unlocked FROM test_submissions WHERE id = test_submissions.id)
  AND payment_status IS NOT DISTINCT FROM (SELECT payment_status FROM test_submissions WHERE id = test_submissions.id)
  AND paid_at IS NOT DISTINCT FROM (SELECT paid_at FROM test_submissions WHERE id = test_submissions.id)
  AND payment_id IS NOT DISTINCT FROM (SELECT payment_id FROM test_submissions WHERE id = test_submissions.id)
);

-- 3. Fix submission ownership: verify paciente/colaborador belongs to user
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.test_submissions;
CREATE POLICY "Authenticated users can create submissions"
ON public.test_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    paciente_id IS NULL
    OR EXISTS (
      SELECT 1 FROM pacientes p
      JOIN profissionais pr ON pr.id = p.profissional_id
      WHERE p.id = test_submissions.paciente_id AND pr.profile_id = auth.uid()
    )
  )
  AND (
    colaborador_id IS NULL
    OR EXISTS (
      SELECT 1 FROM colaboradores c
      JOIN empresas e ON e.id = c.empresa_id
      WHERE c.id = test_submissions.colaborador_id AND e.profile_id = auth.uid()
    )
  )
);
