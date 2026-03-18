
-- Add professional-specific columns to profissionais table
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS tipo_pessoa text DEFAULT 'pf',
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS nome_mae text,
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS razao_social text;

-- Update handle_new_user to store profissional metadata
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
    INSERT INTO public.profissionais (profile_id, tipo_pessoa, cpf, nome_mae, data_nascimento, cnpj, nome_fantasia, razao_social)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'tipo_pessoa', 'pf'),
      NEW.raw_user_meta_data ->> 'cpf',
      NEW.raw_user_meta_data ->> 'nome_mae',
      CASE WHEN NEW.raw_user_meta_data ->> 'data_nascimento' IS NOT NULL 
           THEN (NEW.raw_user_meta_data ->> 'data_nascimento')::date 
           ELSE NULL END,
      NEW.raw_user_meta_data ->> 'prof_cnpj',
      NEW.raw_user_meta_data ->> 'prof_nome_fantasia',
      NEW.raw_user_meta_data ->> 'prof_razao_social'
    );
  ELSE
    INSERT INTO public.usuarios_testes (profile_id, nome, email) 
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  END IF;
  
  RETURN NEW;
END;
$function$;
