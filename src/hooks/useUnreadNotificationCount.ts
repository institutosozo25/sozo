import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  buildManagerHistoryNotifications,
  loadManagerHistoryReadIds,
  type HistoryEntryLike,
} from "@/lib/manager-notifications";

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }

    const [{ data: systemNotifs }, { data: statuses }, { data: historyItems }] = await Promise.all([
      supabase.from("notifications").select("id").limit(200),
      supabase.from("notification_status").select("notification_id, is_read, is_archived, is_deleted").eq("user_id", user.id),
      supabase
        .from("test_history")
        .select("id, test_type, test_name, completed_at, metadata")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(100),
    ]);

    const statusMap = new Map<string, { is_read: boolean; is_archived: boolean; is_deleted: boolean }>();
    (statuses || []).forEach((s: any) => statusMap.set(s.notification_id, s));
    const historyReadIds = loadManagerHistoryReadIds(user.id);

    const historyNotifs = buildManagerHistoryNotifications((historyItems || []) as HistoryEntryLike[]);

    let unread = 0;

    // Count unread system notifications
    for (const n of (systemNotifs || [])) {
      const st = statusMap.get(n.id);
      if (st?.is_deleted || st?.is_archived) continue;
      if (!st?.is_read) unread++;
    }

    // Count unread history notifications
    for (const hn of historyNotifs) {
      const st = statusMap.get(hn.id);
      if (st?.is_deleted || st?.is_archived) continue;
      const isRead = st?.is_read ?? historyReadIds.has(hn.id);
      if (!isRead) unread++;
    }

    setCount(unread);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { count, refresh };
}
