
-- Fix 1: Drop and recreate test_submissions SELECT policies as PERMISSIVE
DROP POLICY IF EXISTS "Users can view own submissions" ON public.test_submissions;
DROP POLICY IF EXISTS "Profissional can view patient submissions" ON public.test_submissions;
DROP POLICY IF EXISTS "Empresa can view colaborador submissions" ON public.test_submissions;

-- Recreate as PERMISSIVE so any ONE matching policy grants access
CREATE POLICY "Users can view own submissions" ON public.test_submissions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Profissional can view patient submissions" ON public.test_submissions
FOR SELECT TO authenticated
USING (
  paciente_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM pacientes p
    JOIN profissionais pr ON pr.id = p.profissional_id
    WHERE p.id = test_submissions.paciente_id 
    AND pr.profile_id = auth.uid()
  )
);

CREATE POLICY "Empresa can view colaborador submissions" ON public.test_submissions
FOR SELECT TO authenticated
USING (
  colaborador_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM colaboradores c
    JOIN empresas e ON e.id = c.empresa_id
    WHERE c.id = test_submissions.colaborador_id 
    AND e.profile_id = auth.uid()
  )
);

-- Fix 2: Recreate profiles SELECT policy to be explicitly clear
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
