
-- Key-value settings table for site configuration
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (public content)
CREATE POLICY "Anyone can read site_settings" ON public.site_settings
  FOR SELECT TO public USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Testimonials table
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  image_url text,
  rating integer NOT NULL DEFAULT 5,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can read active testimonials
CREATE POLICY "Anyone can read active testimonials" ON public.testimonials
  FOR SELECT TO public USING (is_active = true);

-- Admins can read all testimonials (including inactive)
CREATE POLICY "Admins can read all testimonials" ON public.testimonials
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage testimonials
CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('contact_email', 'contato@plenitudesozo.com.br'),
  ('contact_phone', '(00) 00000-0000'),
  ('contact_whatsapp', '5500000000000'),
  ('contact_address', 'Endereço a ser informado'),
  ('contact_city', 'Cidade — Estado, CEP'),
  ('contact_hours', 'Seg a Sex: 8h às 18h | Sáb: 8h às 12h'),
  ('social_instagram', 'https://www.instagram.com/institutoplenitudesozo'),
  ('social_facebook', ''),
  ('social_linkedin', ''),
  ('social_youtube', ''),
  ('hero_stats_users', '2.500+'),
  ('hero_stats_tests', '10.000+'),
  ('hero_stats_companies', '150+');

-- Seed default testimonials
INSERT INTO public.testimonials (name, role, content, image_url, rating, display_order) VALUES
  ('Maria Silva', 'Psicóloga Clínica', 'Os relatórios são incríveis! Economizo horas de trabalho e meus pacientes adoram a profundidade das análises.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', 5, 1),
  ('Carlos Mendes', 'Gerente de RH', 'Implementamos o DISC em toda a empresa e a melhoria na comunicação entre equipes foi imediata. Ferramenta essencial!', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', 5, 2),
  ('Ana Beatriz', 'Coach de Carreira', 'O marketplace mais completo que já encontrei. Uso diariamente com meus coachees e os resultados são transformadores.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face', 5, 3);
