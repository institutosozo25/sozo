
-- Rename table to be manager-focused instead of admin-focused
ALTER TABLE public.admin_notification_preferences RENAME TO manager_notification_preferences;

-- Drop admin-only policy
DROP POLICY IF EXISTS "Admin can manage own preferences" ON public.manager_notification_preferences;

-- Allow any authenticated user to manage their own preferences
CREATE POLICY "User can manage own preferences"
  ON public.manager_notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
