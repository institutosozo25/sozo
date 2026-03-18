ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS nome_fantasia text,
ADD COLUMN IF NOT EXISTS responsavel text,
ADD COLUMN IF NOT EXISTS dados_bloqueados boolean NOT NULL DEFAULT false;