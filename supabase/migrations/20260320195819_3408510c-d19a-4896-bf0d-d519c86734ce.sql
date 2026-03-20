
-- Add data_nascimento to mapso_employees for CPF+DOB validation flow
ALTER TABLE public.mapso_employees ADD COLUMN data_nascimento date NULL;

-- Add status column to mapso_employees (pendente/concluído)
ALTER TABLE public.mapso_employees ADD COLUMN status text NOT NULL DEFAULT 'pendente';

-- Add final_consent_accepted and final_consent_at to mapso_assessments for term tracking
ALTER TABLE public.mapso_assessments ADD COLUMN final_consent_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.mapso_assessments ADD COLUMN final_consent_at timestamp with time zone NULL;
ALTER TABLE public.mapso_assessments ADD COLUMN signature_name text NULL;
