import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Bell, Megaphone, Mail, MailOpen, Archive,
  ArchiveRestore, Settings, Eye, Clock, CheckCircle2,
  XCircle, ChevronLeft, Search, RefreshCw,
} from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by: string;
}

interface NotificationStatusRow {
  notification_id: string;
  is_read: boolean;
  is_archived: boolean;
  is_deleted: boolean;
}

interface EnrichedNotification extends NotificationRow {
  is_read: boolean;
  is_archived: boolean;
  is_deleted: boolean;
}

interface AdminPreferences {
  email_notifications_to: string;
  auto_cleanup_days: number;
  notify_mapso_completion: boolean;
  notify_test_completion: boolean;
  notify_system_updates: boolean;
  notify_promotions: boolean;
}

const DEFAULT_PREFS: AdminPreferences = {
  email_notifications_to: "",
  auto_cleanup_days: 30,
  notify_mapso_completion: true,
  notify_test_completion: true,
  notify_system_updates: true,
  notify_promotions: false,
};

type ViewTab = "inbox" | "archived";

export default function AdminNotificacoes() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("inbox");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<EnrichedNotification | null>(null);

  // Create form
  const [form, setForm] = useState({ title: "", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Preferences
  const [prefs, setPrefs] = useState<AdminPreferences>(DEFAULT_PREFS);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const [{ data: notifs }, { data: statuses }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("notification_status")
        .select("notification_id, is_read, is_archived, is_deleted")
        .eq("user_id", user.id),
    ]);

    const statusMap = new Map<string, NotificationStatusRow>();
    (statuses || []).forEach((s: NotificationStatusRow) =>
      statusMap.set(s.notification_id, s)
    );

    const enriched: EnrichedNotification[] = ((notifs as NotificationRow[]) || []).map((n) => {
      const st = statusMap.get(n.id);
      return {
        ...n,
        is_read: st?.is_read ?? false,
        is_archived: st?.is_archived ?? false,
        is_deleted: st?.is_deleted ?? false,
      };
    });

    setNotifications(enriched);
    setIsLoading(false);
  }, [user]);

  const fetchPrefs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("admin_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setPrefs({
        email_notifications_to: data.email_notifications_to || "",
        auto_cleanup_days: data.auto_cleanup_days ?? 30,
        notify_mapso_completion: data.notify_mapso_completion ?? true,
        notify_test_completion: data.notify_test_completion ?? true,
        notify_system_updates: data.notify_system_updates ?? true,
        notify_promotions: data.notify_promotions ?? false,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
    fetchPrefs();
  }, [fetchAll, fetchPrefs]);

  // ── Status helpers ──
  async function upsertStatus(notificationId: string, updates: Partial<NotificationStatusRow>) {
    if (!user) return;

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      notification_id: notificationId,
      user_id: user.id,
      ...updates,
    };
    if (updates.is_read !== undefined) payload.read_at = updates.is_read ? now : null;
    if (updates.is_archived !== undefined) payload.archived_at = updates.is_archived ? now : null;
    if (updates.is_deleted !== undefined) payload.deleted_at = updates.is_deleted ? now : null;

    await supabase
      .from("notification_status")
      .upsert(payload as any, { onConflict: "notification_id,user_id" });

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, ...updates } : n
      )
    );

    if (selectedNotification?.id === notificationId) {
      setSelectedNotification((prev) => prev ? { ...prev, ...updates } : prev);
    }
  }

  async function markAsRead(id: string) {
    await upsertStatus(id, { is_read: true });
  }

  async function markAsUnread(id: string) {
    await upsertStatus(id, { is_read: false });
  }

  async function archiveNotification(id: string) {
    await upsertStatus(id, { is_archived: true });
    toast({ title: "Notificação arquivada" });
    if (selectedNotification?.id === id) setSelectedNotification(null);
  }

  async function unarchiveNotification(id: string) {
    await upsertStatus(id, { is_archived: false });
    toast({ title: "Notificação restaurada" });
  }

  async function deleteNotification(id: string) {
    if (!confirm("Excluir esta notificação permanentemente?")) return;
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (selectedNotification?.id === id) setSelectedNotification(null);
      toast({ title: "Notificação excluída" });
    }
  }

  // ── Create ──
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = sanitizeString(form.title, 200);
    const message = sanitizeString(form.message, 2000);
    if (!title || !message) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from("notifications").insert({
      title,
      message,
      created_by: user!.id,
    });
    if (error) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notificação publicada!" });
      setForm({ title: "", message: "" });
      setIsCreateOpen(false);
      fetchAll();
    }
    setIsSaving(false);
  }

  // ── Preferences ──
  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setIsSavingPrefs(true);

    const { error } = await supabase
      .from("admin_notification_preferences")
      .upsert(
        {
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
      setIsSettingsOpen(false);
    }
    setIsSavingPrefs(false);
  }

  // ── Filtered views ──
  const filtered = notifications.filter((n) => {
    if (n.is_deleted) return false;
    if (activeTab === "inbox") return !n.is_archived;
    if (activeTab === "archived") return n.is_archived;
    return true;
  });

  const searched = searchQuery
    ? filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filtered;

  const unreadCount = notifications.filter((n) => !n.is_read && !n.is_archived && !n.is_deleted).length;

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatRelative(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  // ── Detail view ──
  if (selectedNotification) {
    return (
      <div className="max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => setSelectedNotification(null)} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{selectedNotification.title}</h2>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatDateTime(selectedNotification.created_at)}</span>
                  {selectedNotification.is_read ? (
                    <Badge variant="secondary" className="text-xs"><MailOpen className="w-3 h-3 mr-1" /> Lida</Badge>
                  ) : (
                    <Badge className="text-xs bg-primary"><Mail className="w-3 h-3 mr-1" /> Não lida</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selectedNotification.message}</p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
              {selectedNotification.is_read ? (
                <Button variant="outline" size="sm" onClick={() => markAsUnread(selectedNotification.id)}>
                  <Mail className="w-4 h-4 mr-1" /> Marcar não lida
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => markAsRead(selectedNotification.id)}>
                  <MailOpen className="w-4 h-4 mr-1" /> Marcar como lida
                </Button>
              )}
              {selectedNotification.is_archived ? (
                <Button variant="outline" size="sm" onClick={() => unarchiveNotification(selectedNotification.id)}>
                  <ArchiveRestore className="w-4 h-4 mr-1" /> Desarquivar
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => archiveNotification(selectedNotification.id)}>
                  <Archive className="w-4 h-4 mr-1" /> Arquivar
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => deleteNotification(selectedNotification.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Megaphone className="w-8 h-8 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Todas lidas"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} title="Configurações">
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAll} title="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova
          </Button>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="inbox" className="gap-2">
            <Mail className="w-4 h-4" /> Caixa de Entrada
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="w-4 h-4" /> Arquivadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          {renderList(searched)}
        </TabsContent>
        <TabsContent value="archived">
          {renderList(searched)}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Notificação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Nova funcionalidade disponível!"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem *</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Descreva a atualização para os usuários..."
                rows={5}
                maxLength={2000}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Configurações de Notificações
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={savePrefs} className="space-y-6 pt-2">
            {/* Email */}
            <div className="space-y-2">
              <Label>E-mail para receber notificações</Label>
              <Input
                type="email"
                placeholder="admin@exemplo.com"
                value={prefs.email_notifications_to}
                onChange={(e) => setPrefs({ ...prefs, email_notifications_to: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para não receber por e-mail.
              </p>
            </div>

            {/* Auto cleanup */}
            <div className="space-y-2">
              <Label>Limpar notificações automaticamente</Label>
              <Select
                value={String(prefs.auto_cleanup_days)}
                onValueChange={(v) => setPrefs({ ...prefs, auto_cleanup_days: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Após 7 dias</SelectItem>
                  <SelectItem value="15">Após 15 dias</SelectItem>
                  <SelectItem value="30">Após 30 dias</SelectItem>
                  <SelectItem value="60">Após 60 dias</SelectItem>
                  <SelectItem value="90">Após 90 dias</SelectItem>
                  <SelectItem value="0">Nunca limpar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification types */}
            <div className="space-y-3">
              <Label className="text-base">Receber notificações de:</Label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.notify_test_completion}
                  onCheckedChange={(c) => setPrefs({ ...prefs, notify_test_completion: !!c })}
                />
                <div>
                  <p className="text-sm font-medium">Conclusão de testes</p>
                  <p className="text-xs text-muted-foreground">Quando um colaborador/paciente conclui um teste (DISC, MBTI, etc.)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.notify_mapso_completion}
                  onCheckedChange={(c) => setPrefs({ ...prefs, notify_mapso_completion: !!c })}
                />
                <div>
                  <p className="text-sm font-medium">Conclusão MAPSO / NR1</p>
                  <p className="text-xs text-muted-foreground">Quando um colaborador finaliza a avaliação MAPSO</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.notify_system_updates}
                  onCheckedChange={(c) => setPrefs({ ...prefs, notify_system_updates: !!c })}
                />
                <div>
                  <p className="text-sm font-medium">Atualizações do sistema</p>
                  <p className="text-xs text-muted-foreground">Novas funcionalidades, manutenções e avisos da plataforma</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.notify_promotions}
                  onCheckedChange={(c) => setPrefs({ ...prefs, notify_promotions: !!c })}
                />
                <div>
                  <p className="text-sm font-medium">Promoções e marketing</p>
                  <p className="text-xs text-muted-foreground">Ofertas especiais, novidades e conteúdo promocional</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingPrefs}>
                {isSavingPrefs ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderList(items: EnrichedNotification[]) {
    if (isLoading) {
      return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {activeTab === "archived" ? "Nenhuma notificação arquivada." : "Nenhuma notificação."}
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-1 border border-border rounded-xl overflow-hidden bg-card">
        {items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors cursor-pointer hover:bg-muted/50 ${
              !n.is_read ? "bg-primary/5" : ""
            }`}
            onClick={() => {
              setSelectedNotification(n);
              if (!n.is_read) markAsRead(n.id);
            }}
          >
            {/* Unread indicator */}
            <div className="pt-1.5 w-3 flex-shrink-0">
              {!n.is_read && <span className="block w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-sm truncate ${!n.is_read ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                  {n.title}
                </h3>
                <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap" title={formatDateTime(n.created_at)}>
                  {formatRelative(n.created_at)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDateTime(n.created_at)}</p>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {n.is_read ? (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsUnread(n.id)} title="Marcar não lida">
                  <Mail className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(n.id)} title="Marcar como lida">
                  <MailOpen className="w-3.5 h-3.5" />
                </Button>
              )}
              {n.is_archived ? (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => unarchiveNotification(n.id)} title="Desarquivar">
                  <ArchiveRestore className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => archiveNotification(n.id)} title="Arquivar">
                  <Archive className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteNotification(n.id)} title="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
