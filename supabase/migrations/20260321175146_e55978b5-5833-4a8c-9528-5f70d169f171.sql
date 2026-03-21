
-- Add colaborador_id column to mapso_assessments referencing the unified colaboradores table
ALTER TABLE public.mapso_assessments 
ADD COLUMN IF NOT EXISTS colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE SET NULL;

-- Allow anon to insert mapso_assessments with colaborador_id (for the respond flow)
-- The existing "Anon can insert mapso assessment via valid link" policy is too restrictive
-- Add a new policy for the generic link flow
CREATE POLICY "Anon can insert mapso assessment via generic link"
ON public.mapso_assessments
FOR INSERT
TO anon
WITH CHECK (
  colaborador_id IS NOT NULL
  AND empresa_id IS NOT NULL
);
