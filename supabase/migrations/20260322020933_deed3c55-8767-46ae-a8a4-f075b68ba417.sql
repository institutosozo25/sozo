
ALTER TABLE public.shared_test_links ADD COLUMN IF NOT EXISTS observation text;
ALTER TABLE public.shared_test_links ADD COLUMN IF NOT EXISTS link_duration_hours integer DEFAULT 72;
