
-- Add cpf and setor_id to colaboradores table
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL;

-- Add unique constraint on cpf per empresa
CREATE UNIQUE INDEX IF NOT EXISTS colaboradores_empresa_cpf_unique ON public.colaboradores (empresa_id, cpf) WHERE cpf IS NOT NULL;
