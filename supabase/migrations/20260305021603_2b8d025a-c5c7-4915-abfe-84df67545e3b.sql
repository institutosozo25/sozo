
-- Add telefone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone text;

-- Create empresas table
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  razao_social text,
  cnpj text,
  email text,
  cep text,
  rua text,
  numero text,
  telefone text,
  celular text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create colaboradores table
CREATE TABLE public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome text,
  data_nascimento date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create profissionais table
CREATE TABLE public.profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endereco text,
  idade integer,
  estado_civil text,
  sexo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create pacientes table
CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE CASCADE NOT NULL,
  nome text,
  email text,
  telefone text,
  endereco text,
  idade integer,
  estado_civil text,
  sexo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create usuarios_testes table
CREATE TABLE public.usuarios_testes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome text,
  email text,
  telefone text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_testes ENABLE ROW LEVEL SECURITY;

-- RLS: empresas - owner can CRUD
CREATE POLICY "Owner can view own empresa" ON public.empresas FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Owner can insert own empresa" ON public.empresas FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Owner can update own empresa" ON public.empresas FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin can manage empresas" ON public.empresas FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: colaboradores - empresa owner can CRUD
CREATE POLICY "Empresa owner can view colaboradores" ON public.colaboradores FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = colaboradores.empresa_id AND empresas.profile_id = auth.uid())
);
CREATE POLICY "Empresa owner can insert colaboradores" ON public.colaboradores FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = colaboradores.empresa_id AND empresas.profile_id = auth.uid())
);
CREATE POLICY "Empresa owner can update colaboradores" ON public.colaboradores FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = colaboradores.empresa_id AND empresas.profile_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = colaboradores.empresa_id AND empresas.profile_id = auth.uid())
);
CREATE POLICY "Empresa owner can delete colaboradores" ON public.colaboradores FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.empresas WHERE empresas.id = colaboradores.empresa_id AND empresas.profile_id = auth.uid())
);
CREATE POLICY "Admin can manage colaboradores" ON public.colaboradores FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: profissionais - owner can CRUD
CREATE POLICY "Owner can view own profissional" ON public.profissionais FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Owner can insert own profissional" ON public.profissionais FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Owner can update own profissional" ON public.profissionais FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin can manage profissionais" ON public.profissionais FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: pacientes - profissional owner can CRUD
CREATE POLICY "Profissional can view pacientes" ON public.pacientes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profissionais WHERE profissionais.id = pacientes.profissional_id AND profissionais.profile_id = auth.uid())
);
CREATE POLICY "Profissional can insert pacientes" ON public.pacientes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profissionais WHERE profissionais.id = pacientes.profissional_id AND profissionais.profile_id = auth.uid())
);
CREATE POLICY "Profissional can update pacientes" ON public.pacientes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profissionais WHERE profissionais.id = pacientes.profissional_id AND profissionais.profile_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profissionais WHERE profissionais.id = pacientes.profissional_id AND profissionais.profile_id = auth.uid())
);
CREATE POLICY "Profissional can delete pacientes" ON public.pacientes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profissionais WHERE profissionais.id = pacientes.profissional_id AND profissionais.profile_id = auth.uid())
);
CREATE POLICY "Admin can manage pacientes" ON public.pacientes FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: usuarios_testes - owner can CRUD
CREATE POLICY "Owner can view own usuario_teste" ON public.usuarios_testes FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Owner can insert own usuario_teste" ON public.usuarios_testes FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Owner can update own usuario_teste" ON public.usuarios_testes FOR UPDATE USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin can manage usuarios_testes" ON public.usuarios_testes FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user to assign role from metadata and add telefone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
  _app_role app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'user');
  
  -- Map account_type to app_role enum
  IF _role = 'empresa' THEN
    _app_role := 'company';
  ELSIF _role = 'profissional' THEN
    _app_role := 'professional';
  ELSE
    _app_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, telefone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email, NEW.raw_user_meta_data ->> 'telefone');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _app_role);

  -- Auto-create role-specific record
  IF _role = 'empresa' THEN
    INSERT INTO public.empresas (profile_id, email) VALUES (NEW.id, NEW.email);
  ELSIF _role = 'profissional' THEN
    INSERT INTO public.profissionais (profile_id) VALUES (NEW.id);
  ELSE
    INSERT INTO public.usuarios_testes (profile_id, nome, email) 
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update profiles RLS to allow insert (needed for trigger)
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
