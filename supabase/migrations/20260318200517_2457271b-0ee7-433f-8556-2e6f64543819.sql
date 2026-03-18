CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _account_type text;
  _app_role app_role;
  _plan text;
BEGIN
  _account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'usuario');
  _app_role := 'user';
  
  IF _account_type = 'empresa' THEN
    _plan := 'enterprise';
  ELSIF _account_type = 'profissional' THEN
    _plan := 'professional';
  ELSE
    _plan := 'free';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, telefone, subscription_plan, subscription_status)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email, NEW.raw_user_meta_data ->> 'telefone', _plan, 'active');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _app_role);

  IF _account_type = 'empresa' THEN
    INSERT INTO public.empresas (profile_id, email, cnpj, razao_social, nome_fantasia, responsavel, dados_bloqueados)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'cnpj',
      NEW.raw_user_meta_data ->> 'razao_social',
      NEW.raw_user_meta_data ->> 'nome_fantasia',
      NEW.raw_user_meta_data ->> 'responsavel',
      true
    );
  ELSIF _account_type = 'profissional' THEN
    INSERT INTO public.profissionais (profile_id) VALUES (NEW.id);
  ELSE
    INSERT INTO public.usuarios_testes (profile_id, nome, email) 
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  END IF;
  
  RETURN NEW;
END;
$function$;