
-- Notifications posted by admin
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read notifications
CREATE POLICY "Authenticated can view notifications"
ON public.notifications FOR SELECT TO authenticated
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Track which user has read which notification
CREATE TABLE public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads"
ON public.notification_reads FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark as read"
ON public.notification_reads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Index for performance
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notification_reads_user ON public.notification_reads(user_id, notification_id);
