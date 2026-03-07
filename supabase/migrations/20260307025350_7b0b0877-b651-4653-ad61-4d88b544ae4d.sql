
-- Add payment fields to test_submissions
ALTER TABLE public.test_submissions
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS test_result_unlocked boolean NOT NULL DEFAULT false;

-- Add subscription and Asaas fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS asaas_customer_id text;

-- Create payments table for tracking all transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'one_time', -- 'one_time' | 'subscription'
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | confirmed | refunded | failed
  asaas_payment_id text,
  asaas_subscription_id text,
  submission_id uuid REFERENCES public.test_submissions(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments RLS policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON public.payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_submission_id ON public.payments(submission_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_test_submissions_paid ON public.test_submissions(paid);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_asaas_customer_id ON public.profiles(asaas_customer_id);

-- Subscription plans reference table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  interval text NOT NULL DEFAULT 'monthly', -- monthly | yearly
  features jsonb DEFAULT '[]',
  target_role text NOT NULL, -- professional | company
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, description, price, interval, target_role, features) VALUES
  ('Profissional', 'professional', 'Acesso completo para profissionais da saúde mental', 149.90, 'monthly', 'professional', '["Aplicar testes ilimitados", "Gerenciar pacientes", "Relatórios completos", "Suporte prioritário"]'),
  ('Empresarial', 'enterprise', 'Gestão completa de testes para empresas', 499.90, 'monthly', 'company', '["Testes ilimitados para colaboradores", "Gerenciar colaboradores", "Relatórios organizacionais", "Dashboard analítico", "Suporte dedicado"]');
