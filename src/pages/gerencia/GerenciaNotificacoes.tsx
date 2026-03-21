import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildManagerHistoryNotifications,
  loadManagerHistoryReadIds,
  saveManagerHistoryReadIds,
  type HistoryEntryLike,
} from "@/lib/manager-notifications";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export default function GerenciaNotificacoes() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: notifs }, { data: reads }, { data: historyItems }] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("notification_reads").select("notification_id").eq("user_id", user.id),
        supabase
          .from("test_history")
          .select("id, test_type, test_name, completed_at, metadata")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(50),
      ]);

      const derivedNotifications = buildManagerHistoryNotifications((historyItems || []) as HistoryEntryLike[]);
      const mergedNotifications = [...derivedNotifications, ...(notifs || [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const readSet = new Set([
        ...(reads || []).map((r) => r.notification_id),
        ...loadManagerHistoryReadIds(user.id),
      ]);
      setReadIds(readSet);
      setNotifications(
        mergedNotifications.map((n) => ({ ...n, read: readSet.has(n.id) }))
      );
    };
    fetch();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user || readIds.has(id)) return;

    if (id.startsWith("history-")) {
      const nextReadIds = new Set([...readIds, id]);
      saveManagerHistoryReadIds(user.id, Array.from(nextReadIds).filter((value) => value.startsWith("history-")));
    } else {
      await supabase.from("notification_reads").insert({ user_id: user.id, notification_id: id });
    }

    setReadIds((prev) => new Set(prev).add(id));
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">Comunicados e atualizações da plataforma.</p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma notificação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{n.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {!n.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Marcar como lida
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
