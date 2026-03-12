
-- 1. Create mapso_employees table
CREATE TABLE public.mapso_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  name text NOT NULL,
  cpf text,
  department text,
  position text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create mapso_assessment_links table
CREATE TABLE public.mapso_assessment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.mapso_employees(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add employee_id and empresa_id to mapso_assessments
ALTER TABLE public.mapso_assessments
  ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.mapso_employees(id),
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id),
  ADD COLUMN IF NOT EXISTS link_id uuid REFERENCES public.mapso_assessment_links(id);

-- 4. Indexes
CREATE INDEX idx_mapso_employees_empresa ON public.mapso_employees(empresa_id);
CREATE INDEX idx_mapso_links_empresa ON public.mapso_assessment_links(empresa_id);
CREATE INDEX idx_mapso_links_token ON public.mapso_assessment_links(token);
CREATE INDEX idx_mapso_assessments_empresa ON public.mapso_assessments(empresa_id);
CREATE INDEX idx_mapso_assessments_employee ON public.mapso_assessments(employee_id);

-- 5. RLS for mapso_employees
ALTER TABLE public.mapso_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage mapso_employees"
  ON public.mapso_employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Empresa owner can manage mapso_employees"
  ON public.mapso_employees FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = mapso_employees.empresa_id AND empresas.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = mapso_employees.empresa_id AND empresas.profile_id = auth.uid()));

-- 6. RLS for mapso_assessment_links
ALTER TABLE public.mapso_assessment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage mapso_assessment_links"
  ON public.mapso_assessment_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Empresa owner can manage mapso_assessment_links"
  ON public.mapso_assessment_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = mapso_assessment_links.empresa_id AND empresas.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = mapso_assessment_links.empresa_id AND empresas.profile_id = auth.uid()));

-- Allow anonymous access to read links by token (for employee responding)
CREATE POLICY "Anyone can read link by token"
  ON public.mapso_assessment_links FOR SELECT TO anon, authenticated
  USING (true);

-- Allow anonymous to update link status when completing
CREATE POLICY "Anyone can update link status"
  ON public.mapso_assessment_links FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (status IN ('pending', 'in_progress', 'completed'));

-- 7. Allow anonymous inserts to mapso_assessments (employee completing test)
CREATE POLICY "Anon can insert mapso assessment via link"
  ON public.mapso_assessments FOR INSERT TO anon, authenticated
  WITH CHECK (link_id IS NOT NULL);
