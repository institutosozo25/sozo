
-- Add suspended_at to profiles for account suspension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at timestamptz DEFAULT NULL;

-- Create a secure function to delete a user account completely (LGPD)
-- This must be SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from dependent tables (cascades handle most, but be explicit)
  DELETE FROM public.generated_reports WHERE submission_id IN (
    SELECT id FROM public.test_submissions WHERE user_id = _uid
  );
  DELETE FROM public.submission_answers WHERE submission_id IN (
    SELECT id FROM public.test_submissions WHERE user_id = _uid
  );
  DELETE FROM public.test_submissions WHERE user_id = _uid;
  DELETE FROM public.payments WHERE user_id = _uid;
  DELETE FROM public.waitlist WHERE email = (SELECT email FROM public.profiles WHERE id = _uid);
  DELETE FROM public.pacientes WHERE profissional_id IN (SELECT id FROM public.profissionais WHERE profile_id = _uid);
  DELETE FROM public.colaboradores WHERE empresa_id IN (SELECT id FROM public.empresas WHERE profile_id = _uid);
  DELETE FROM public.profissionais WHERE profile_id = _uid;
  DELETE FROM public.empresas WHERE profile_id = _uid;
  DELETE FROM public.usuarios_testes WHERE profile_id = _uid;
  DELETE FROM public.invites WHERE invited_by = _uid;
  DELETE FROM public.user_roles WHERE user_id = _uid;
  DELETE FROM public.audit_logs WHERE user_id = _uid;
  DELETE FROM public.profiles WHERE id = _uid;

  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

-- Admin function to suspend/unsuspend a user
CREATE OR REPLACE FUNCTION public.admin_suspend_user(_target_user_id uuid, _suspend boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  
  UPDATE public.profiles 
  SET suspended_at = CASE WHEN _suspend THEN now() ELSE NULL END
  WHERE id = _target_user_id;
END;
$$;

-- Admin function to delete any user account
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  DELETE FROM public.generated_reports WHERE submission_id IN (
    SELECT id FROM public.test_submissions WHERE user_id = _target_user_id
  );
  DELETE FROM public.submission_answers WHERE submission_id IN (
    SELECT id FROM public.test_submissions WHERE user_id = _target_user_id
  );
  DELETE FROM public.test_submissions WHERE user_id = _target_user_id;
  DELETE FROM public.payments WHERE user_id = _target_user_id;
  DELETE FROM public.pacientes WHERE profissional_id IN (SELECT id FROM public.profissionais WHERE profile_id = _target_user_id);
  DELETE FROM public.colaboradores WHERE empresa_id IN (SELECT id FROM public.empresas WHERE profile_id = _target_user_id);
  DELETE FROM public.profissionais WHERE profile_id = _target_user_id;
  DELETE FROM public.empresas WHERE profile_id = _target_user_id;
  DELETE FROM public.usuarios_testes WHERE profile_id = _target_user_id;
  DELETE FROM public.invites WHERE invited_by = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.audit_logs WHERE user_id = _target_user_id;
  DELETE FROM public.profiles WHERE id = _target_user_id;
  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$$;
