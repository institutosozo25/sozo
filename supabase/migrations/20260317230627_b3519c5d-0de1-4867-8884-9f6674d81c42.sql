
CREATE OR REPLACE FUNCTION public.admin_set_user_plan(
  _target_user_id uuid,
  _plan text,
  _status text DEFAULT 'active'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old_plan text;
  _old_status text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT subscription_plan, subscription_status
  INTO _old_plan, _old_status
  FROM public.profiles
  WHERE id = _target_user_id;

  UPDATE public.profiles
  SET subscription_plan = _plan,
      subscription_status = _status,
      updated_at = now()
  WHERE id = _target_user_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'admin_set_plan',
    'profile',
    _target_user_id,
    jsonb_build_object(
      'old_plan', _old_plan,
      'new_plan', _plan,
      'old_status', _old_status,
      'new_status', _status
    )
  );
END;
$$;
