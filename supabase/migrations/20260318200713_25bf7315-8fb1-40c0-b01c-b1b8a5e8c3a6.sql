CREATE OR REPLACE FUNCTION public.prevent_empresa_locked_fields_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role and admin to bypass
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- If dados_bloqueados is true, prevent changes to locked fields
  IF OLD.dados_bloqueados = true THEN
    IF NEW.cnpj IS DISTINCT FROM OLD.cnpj
      OR NEW.razao_social IS DISTINCT FROM OLD.razao_social
      OR NEW.nome_fantasia IS DISTINCT FROM OLD.nome_fantasia
      OR NEW.responsavel IS DISTINCT FROM OLD.responsavel
    THEN
      -- Check if caller is admin
      IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Dados cadastrais da empresa estão bloqueados e não podem ser alterados.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER prevent_empresa_locked_update
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_empresa_locked_fields_update();