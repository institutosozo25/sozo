
CREATE TABLE public.mapso_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_name text NOT NULL,
  organization_sector text,
  organization_department text,
  employee_count integer,
  irp numeric NOT NULL,
  irp_classification text NOT NULL,
  ipp numeric NOT NULL,
  ivo integer NOT NULL,
  dimension_scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  diagnosis_html text,
  report_html text,
  action_plan jsonb DEFAULT '[]'::jsonb,
  consent_accepted boolean DEFAULT false NOT NULL,
  drive_diagnosis_file_id text,
  drive_report_file_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE public.mapso_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all mapso assessments" ON public.mapso_assessments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can view own mapso assessments" ON public.mapso_assessments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own mapso assessments" ON public.mapso_assessments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Company owner can view mapso assessments" ON public.mapso_assessments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.empresas e
      WHERE e.profile_id = auth.uid()
      AND e.razao_social = mapso_assessments.organization_name
    )
  );
