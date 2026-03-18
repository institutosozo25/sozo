import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      const [{ data: notifs }, { data: reads }] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("notification_reads").select("notification_id").eq("user_id", user.id),
      ]);
      const readSet = new Set((reads || []).map((r) => r.notification_id));
      setReadIds(readSet);
      setNotifications(
        (notifs || []).map((n) => ({ ...n, read: readSet.has(n.id) }))
      );
    };
    fetch();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user || readIds.has(id)) return;
    await supabase.from("notification_reads").insert({ user_id: user.id, notification_id: id });
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
