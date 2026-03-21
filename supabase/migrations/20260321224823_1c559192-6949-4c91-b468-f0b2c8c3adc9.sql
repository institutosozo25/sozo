
-- Admin notification preferences
CREATE TABLE public.admin_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications_to text DEFAULT NULL,
  auto_cleanup_days integer DEFAULT 30,
  notify_mapso_completion boolean DEFAULT true,
  notify_test_completion boolean DEFAULT true,
  notify_system_updates boolean DEFAULT true,
  notify_promotions boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage own preferences"
  ON public.admin_notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

-- Notification user status (read, archived, deleted per user)
CREATE TABLE public.notification_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  read_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

ALTER TABLE public.notification_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification status"
  ON public.notification_status FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
