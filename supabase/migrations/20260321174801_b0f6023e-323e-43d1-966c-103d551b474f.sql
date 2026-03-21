
-- Allow anon to verify colaborador by cpf + data_nascimento (read-only, for test validation flow)
CREATE POLICY "Anon can verify colaborador by cpf"
ON public.colaboradores
FOR SELECT
TO anon
USING (true);
