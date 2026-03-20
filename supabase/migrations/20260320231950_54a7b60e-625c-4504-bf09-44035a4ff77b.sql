
-- Generic shareable test links table (for all 5 tests, not just MAPSO)
CREATE TABLE public.shared_test_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_owner CHECK (
    (empresa_id IS NOT NULL AND profissional_id IS NULL) OR
    (empresa_id IS NULL AND profissional_id IS NOT NULL)
  )
);

-- Index for token lookup
CREATE UNIQUE INDEX idx_shared_test_links_token ON public.shared_test_links(token);
CREATE INDEX idx_shared_test_links_empresa ON public.shared_test_links(empresa_id);
CREATE INDEX idx_shared_test_links_profissional ON public.shared_test_links(profissional_id);

-- Enable RLS
ALTER TABLE public.shared_test_links ENABLE ROW LEVEL SECURITY;

-- Empresa owner can manage their links
CREATE POLICY "Empresa owner can manage shared_test_links"
ON public.shared_test_links
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM empresas WHERE empresas.id = shared_test_links.empresa_id AND empresas.profile_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM empresas WHERE empresas.id = shared_test_links.empresa_id AND empresas.profile_id = auth.uid())
);

-- Profissional owner can manage their links
CREATE POLICY "Profissional owner can manage shared_test_links"
ON public.shared_test_links
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profissionais WHERE profissionais.id = shared_test_links.profissional_id AND profissionais.profile_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profissionais WHERE profissionais.id = shared_test_links.profissional_id AND profissionais.profile_id = auth.uid())
);

-- Admin can manage all
CREATE POLICY "Admin can manage shared_test_links"
ON public.shared_test_links
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anon can read active links by token (for the respond flow)
CREATE POLICY "Anon can read active links by token"
ON public.shared_test_links
FOR SELECT
TO anon
USING (status = 'active' AND expires_at > now());

-- Add CPF and data_nascimento to pacientes for validation
ALTER TABLE public.pacientes
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS data_nascimento date;
