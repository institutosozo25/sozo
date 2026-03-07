
-- Fix: replace overly permissive payments policies with security definer function approach
-- The webhook will use service_role key, so we can tighten client-side policies

DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
DROP POLICY IF EXISTS "System can update payments" ON public.payments;

-- Only authenticated users can create their own payments
CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update payments (webhook uses service_role which bypasses RLS)
CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
