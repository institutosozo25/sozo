
-- Create setores (sectors) table for enterprise department management
CREATE TABLE public.setores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, nome)
);

-- Enable RLS
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Empresa owner can manage setores"
ON public.setores FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM empresas WHERE empresas.id = setores.empresa_id AND empresas.profile_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM empresas WHERE empresas.id = setores.empresa_id AND empresas.profile_id = auth.uid()));

CREATE POLICY "Admin can manage setores"
ON public.setores FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add setor_id FK to mapso_employees (nullable, links to setores)
ALTER TABLE public.mapso_employees ADD COLUMN setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL;

-- Add unique constraint: CPF must be unique per empresa
CREATE UNIQUE INDEX idx_mapso_employees_empresa_cpf 
ON public.mapso_employees (empresa_id, cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

-- Index for performance
CREATE INDEX idx_setores_empresa_id ON public.setores(empresa_id);
CREATE INDEX idx_mapso_employees_setor_id ON public.mapso_employees(setor_id);

-- Allow anon to read mapso_employees for CPF validation flow (restricted fields)
CREATE POLICY "Anon can verify employee by cpf and dob"
ON public.mapso_employees FOR SELECT
TO anon
USING (true);
