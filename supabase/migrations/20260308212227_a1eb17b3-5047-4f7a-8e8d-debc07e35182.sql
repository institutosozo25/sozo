
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  test_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, test_slug)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (even anon for lead capture)
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
FOR INSERT TO authenticated
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view waitlist" ON public.waitlist
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
