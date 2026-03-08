
-- FIX 1: test_submissions UPDATE policy — self-referential tautology bug
DROP POLICY IF EXISTS "Users can update own submissions safely" ON public.test_submissions;

CREATE POLICY "Users can update own submissions safely"
ON public.test_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND paid = (SELECT ts2.paid FROM public.test_submissions ts2 WHERE ts2.id = test_submissions.id)
  AND test_result_unlocked = (SELECT ts2.test_result_unlocked FROM public.test_submissions ts2 WHERE ts2.id = test_submissions.id)
  AND NOT (payment_status IS DISTINCT FROM (SELECT ts2.payment_status FROM public.test_submissions ts2 WHERE ts2.id = test_submissions.id))
  AND NOT (paid_at IS DISTINCT FROM (SELECT ts2.paid_at FROM public.test_submissions ts2 WHERE ts2.id = test_submissions.id))
  AND NOT (payment_id IS DISTINCT FROM (SELECT ts2.payment_id FROM public.test_submissions ts2 WHERE ts2.id = test_submissions.id))
);

-- FIX 2: Tighten INSERT — enforce safe defaults on creation
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.test_submissions;

CREATE POLICY "Authenticated users can create submissions"
ON public.test_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND paid = false
  AND test_result_unlocked = false
  AND payment_status = 'pending'
  AND (
    paciente_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.pacientes p
      JOIN public.profissionais pr ON pr.id = p.profissional_id
      WHERE p.id = test_submissions.paciente_id AND pr.profile_id = auth.uid()
    )
  )
  AND (
    colaborador_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.colaboradores c
      JOIN public.empresas e ON e.id = c.empresa_id
      WHERE c.id = test_submissions.colaborador_id AND e.profile_id = auth.uid()
    )
  )
);

-- FIX 3: Restrict answer_options to authenticated users only
DROP POLICY IF EXISTS "Anyone can view answer options" ON public.answer_options;

CREATE POLICY "Authenticated can view answer options"
ON public.answer_options
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.tests t ON t.id = q.test_id
    WHERE q.id = answer_options.question_id AND t.is_active = true
  )
);

-- FIX 4: Tighten INSERT on payments
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;

CREATE POLICY "Users can insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND asaas_payment_id IS NULL
  AND asaas_subscription_id IS NULL
);
