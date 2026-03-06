
-- =============================================
-- 1. AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert (via function call)
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Security definer function to log events (callable from client or triggers)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _entity_type text,
  _entity_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _metadata);
END;
$$;

-- Indexes for audit_logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- =============================================
-- 2. INVITES
-- =============================================
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT invites_valid_target CHECK (
    (empresa_id IS NOT NULL AND profissional_id IS NULL) OR
    (empresa_id IS NULL AND profissional_id IS NOT NULL) OR
    (empresa_id IS NULL AND profissional_id IS NULL)
  )
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Empresa owner can manage their invites
CREATE POLICY "Empresa owner can view invites" ON public.invites
  FOR SELECT TO authenticated
  USING (
    invited_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = invites.empresa_id AND empresas.profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profissionais WHERE profissionais.id = invites.profissional_id AND profissionais.profile_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Empresa or profissional can create invites" ON public.invites
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND (
      (empresa_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = invites.empresa_id AND empresas.profile_id = auth.uid())) OR
      (profissional_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profissionais WHERE profissionais.id = invites.profissional_id AND profissionais.profile_id = auth.uid())) OR
      (empresa_id IS NULL AND profissional_id IS NULL)
    )
  );

CREATE POLICY "Invite creator can update" ON public.invites
  FOR UPDATE TO authenticated
  USING (invited_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (invited_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage invites" ON public.invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for invites
CREATE UNIQUE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_email ON public.invites(email);
CREATE INDEX idx_invites_empresa_id ON public.invites(empresa_id) WHERE empresa_id IS NOT NULL;
CREATE INDEX idx_invites_profissional_id ON public.invites(profissional_id) WHERE profissional_id IS NOT NULL;
CREATE INDEX idx_invites_status ON public.invites(status);

-- =============================================
-- 3. IMPROVE test_submissions
-- =============================================
-- Add relational fields to test_submissions
ALTER TABLE public.test_submissions 
  ADD COLUMN IF NOT EXISTS applied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL;

-- Indexes for test_submissions
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id ON public.test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id ON public.test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_applied_by ON public.test_submissions(applied_by) WHERE applied_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_submissions_paciente_id ON public.test_submissions(paciente_id) WHERE paciente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_submissions_colaborador_id ON public.test_submissions(colaborador_id) WHERE colaborador_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_submissions_status ON public.test_submissions(status);
CREATE INDEX IF NOT EXISTS idx_test_submissions_started_at ON public.test_submissions(started_at DESC);

-- =============================================
-- 4. SCALABILITY INDEXES ON EXISTING TABLES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_empresas_profile_id ON public.empresas(profile_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_empresa_id ON public.colaboradores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_profile_id ON public.profissionais(profile_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_profissional_id ON public.pacientes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_testes_profile_id ON public.usuarios_testes(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON public.questions(test_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_question_id ON public.answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_submission_id ON public.submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_submission_id ON public.generated_reports(submission_id);
CREATE INDEX IF NOT EXISTS idx_tests_slug ON public.tests(slug);
CREATE INDEX IF NOT EXISTS idx_tests_is_active ON public.tests(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- UNIQUE constraints to prevent duplicate tenant records
ALTER TABLE public.empresas ADD CONSTRAINT empresas_profile_id_unique UNIQUE (profile_id);
ALTER TABLE public.profissionais ADD CONSTRAINT profissionais_profile_id_unique UNIQUE (profile_id);
ALTER TABLE public.usuarios_testes ADD CONSTRAINT usuarios_testes_profile_id_unique UNIQUE (profile_id);

-- =============================================
-- 5. RLS FIX: Add missing DELETE policies + restrict anonymous inserts
-- =============================================

-- Fix: empresas owner delete
CREATE POLICY "Owner can delete own empresa" ON public.empresas FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Fix: profissionais owner delete  
CREATE POLICY "Owner can delete own profissional" ON public.profissionais FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Fix: usuarios_testes owner delete
CREATE POLICY "Owner can delete own usuario_teste" ON public.usuarios_testes FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- New RLS for test_submissions: profissional/empresa can view submissions of their patients/colaboradores
CREATE POLICY "Profissional can view patient submissions" ON public.test_submissions
  FOR SELECT TO authenticated
  USING (
    paciente_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.pacientes p
      JOIN public.profissionais pr ON pr.id = p.profissional_id
      WHERE p.id = test_submissions.paciente_id AND pr.profile_id = auth.uid()
    )
  );

CREATE POLICY "Empresa can view colaborador submissions" ON public.test_submissions
  FOR SELECT TO authenticated
  USING (
    colaborador_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.colaboradores c
      JOIN public.empresas e ON e.id = c.empresa_id
      WHERE c.id = test_submissions.colaborador_id AND e.profile_id = auth.uid()
    )
  );
