import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell, Mail, MailOpen, Archive, ArchiveRestore, Trash2,
  Settings, ChevronLeft, Search, RefreshCw, Clock,
} from "lucide-react";
import {
  buildManagerHistoryNotifications,
  loadManagerHistoryReadIds,
  saveManagerHistoryReadIds,
  getManagedScoreSummary,
  extractManagedScores,
  type HistoryEntryLike,
} from "@/lib/manager-notifications";

// ── Types ──

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

interface NotificationStatusRow {
  notification_id: string;
  is_read: boolean;
  is_archived: boolean;
  is_deleted: boolean;
}

interface EnrichedNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  source: "system" | "history";
  is_read: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  // Extra detail for history-derived
  testType?: string;
  respondentName?: string;
  scoreSummary?: { label: string; detail?: string } | null;
}

interface ManagerPreferences {
  email_notifications_to: string;
  auto_cleanup_days: number;
  notify_mapso_completion: boolean;
  notify_test_completion: boolean;
  notify_system_updates: boolean;
  notify_promotions: boolean;
}

const DEFAULT_PREFS: ManagerPreferences = {
  email_notifications_to: "",
  auto_cleanup_days: 30,
  notify_mapso_completion: true,
  notify_test_completion: true,
  notify_system_updates: true,
  notify_promotions: false,
};

type ViewTab = "inbox" | "archived";

export default function GerenciaNotificacoes() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ViewTab>("inbox");
  const [searchQuery, setSearchQuery] = useState("");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<EnrichedNotification | null>(null);

  const [prefs, setPrefs] = useState<ManagerPreferences>(DEFAULT_PREFS);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const [{ data: systemNotifs }, { data: statuses }, { data: historyItems }] = await Promise.all([
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("notification_status").select("notification_id, is_read, is_archived, is_deleted").eq("user_id", user.id),
      supabase
        .from("test_history")
        .select("id, test_type, test_name, completed_at, metadata")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(100),
    ]);

    // Build status maps
    const dbStatusMap = new Map<string, NotificationStatusRow>();
    (statuses || []).forEach((s: any) => dbStatusMap.set(s.notification_id, s));
    const historyReadIds = loadManagerHistoryReadIds(user.id);

    // Build history-derived notifications
    const historyNotifs = buildManagerHistoryNotifications((historyItems || []) as HistoryEntryLike[]);
    const historyEnriched: EnrichedNotification[] = historyNotifs.map((hn) => {
      const entry = (historyItems || []).find((h: any) => `history-${h.id}` === hn.id) as HistoryEntryLike | undefined;
      const scores = entry ? extractManagedScores(entry.metadata) : null;
      const scoreSummary = entry ? getManagedScoreSummary(entry.test_type, scores) : null;
      const st = dbStatusMap.get(hn.id);
      return {
        ...hn,
        is_read: st?.is_read ?? historyReadIds.has(hn.id),
        is_archived: st?.is_archived ?? false,
        is_deleted: st?.is_deleted ?? false,
        testType: entry?.test_type,
        respondentName: hn.title.split(" concluiu ")[0],
        scoreSummary,
      };
    });

    // Build system notifications
    const systemEnriched: EnrichedNotification[] = ((systemNotifs as SystemNotification[]) || []).map((n) => {
      const st = dbStatusMap.get(n.id);
      return {
        ...n,
        source: "system" as const,
        is_read: st?.is_read ?? false,
        is_archived: st?.is_archived ?? false,
        is_deleted: st?.is_deleted ?? false,
      };
    });

    const merged = [...historyEnriched, ...systemEnriched]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setNotifications(merged);
    setIsLoading(false);
  }, [user]);

  const fetchPrefs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("manager_notification_preferences" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      const d = data as any;
      setPrefs({
        email_notifications_to: d.email_notifications_to || "",
        auto_cleanup_days: d.auto_cleanup_days ?? 30,
        notify_mapso_completion: d.notify_mapso_completion ?? true,
        notify_test_completion: d.notify_test_completion ?? true,
        notify_system_updates: d.notify_system_updates ?? true,
        notify_promotions: d.notify_promotions ?? false,
      });
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
    fetchPrefs();
  }, [fetchAll, fetchPrefs]);

  // ── Status helpers ──
  async function upsertStatus(notificationId: string, updates: Partial<Pick<EnrichedNotification, "is_read" | "is_archived" | "is_deleted">>) {
    if (!user) return;
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      notification_id: notificationId,
      user_id: user.id,
    };
    if (updates.is_read !== undefined) { payload.is_read = updates.is_read; payload.read_at = updates.is_read ? now : null; }
    if (updates.is_archived !== undefined) { payload.is_archived = updates.is_archived; payload.archived_at = updates.is_archived ? now : null; }
    if (updates.is_deleted !== undefined) { payload.is_deleted = updates.is_deleted; payload.deleted_at = updates.is_deleted ? now : null; }

    await supabase
      .from("notification_status")
      .upsert(payload as any, { onConflict: "notification_id,user_id" });

    // Also persist history reads to localStorage for backward compat
    if (notificationId.startsWith("history-") && updates.is_read !== undefined) {
      const currentReads = loadManagerHistoryReadIds(user.id);
      if (updates.is_read) currentReads.add(notificationId);
      else currentReads.delete(notificationId);
      saveManagerHistoryReadIds(user.id, currentReads);
    }

    setNotifications((prev) =>
      prev.map((n) => n.id === notificationId ? { ...n, ...updates } : n)
    );
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification((prev) => prev ? { ...prev, ...updates } : prev);
    }
  }

  async function markAsRead(id: string) { await upsertStatus(id, { is_read: true }); }
  async function markAsUnread(id: string) { await upsertStatus(id, { is_read: false }); }

  async function archiveNotification(id: string) {
    await upsertStatus(id, { is_archived: true });
    if (selectedNotification?.id === id) setSelectedNotification(null);
  }

  async function unarchiveNotification(id: string) {
    await upsertStatus(id, { is_archived: false });
  }

  async function softDeleteNotification(id: string) {
    await upsertStatus(id, { is_deleted: true });
    if (selectedNotification?.id === id) setSelectedNotification(null);
  }

  // ── Preferences ──
  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setIsSavingPrefs(true);

    const { error } = await supabase
      .from("manager_notification_preferences" as any)
      .upsert(
        { user_id: user.id, ...prefs, updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error saving prefs:", error);
    }
    setIsSavingPrefs(false);
    setIsSettingsOpen(false);
  }

  // ── Filters ──
  const filtered = notifications.filter((n) => {
    if (n.is_deleted) return false;
    if (activeTab === "inbox") return !n.is_archived;
    if (activeTab === "archived") return n.is_archived;
    return true;
  });

  const searched = searchQuery
    ? filtered.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filtered;

  const unreadCount = notifications.filter((n) => !n.is_read && !n.is_archived && !n.is_deleted).length;

  // ── Formatters ──
  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
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

  function getSourceBadge(n: EnrichedNotification) {
    if (n.source === "history") {
      return <Badge variant="outline" className="text-[10px] px-1.5 h-5">Teste concluído</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] px-1.5 h-5">Sistema</Badge>;
  }

  // ── Detail View ──
  if (selectedNotification) {
    const n = selectedNotification;
    return (
      <div className="max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => setSelectedNotification(null)} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getSourceBadge(n)}
                  {n.is_read ? (
                    <Badge variant="secondary" className="text-[10px]"><MailOpen className="w-3 h-3 mr-1" /> Lida</Badge>
                  ) : (
                    <Badge className="text-[10px] bg-primary text-primary-foreground"><Mail className="w-3 h-3 mr-1" /> Não lida</Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground">{n.title}</h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatDateTime(n.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Score summary for test-based notifications */}
            {n.scoreSummary && (
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Resultado</p>
                <p className="text-lg font-bold text-foreground">{n.scoreSummary.label}</p>
                {n.scoreSummary.detail && (
                  <p className="text-sm text-muted-foreground">{n.scoreSummary.detail}</p>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{n.message}</p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border flex-wrap">
              {n.is_read ? (
                <Button variant="outline" size="sm" onClick={() => markAsUnread(n.id)}>
                  <Mail className="w-4 h-4 mr-1" /> Marcar não lida
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => markAsRead(n.id)}>
                  <MailOpen className="w-4 h-4 mr-1" /> Marcar como lida
                </Button>
              )}
              {n.is_archived ? (
                <Button variant="outline" size="sm" onClick={() => unarchiveNotification(n.id)}>
                  <ArchiveRestore className="w-4 h-4 mr-1" /> Desarquivar
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => archiveNotification(n.id)}>
                  <Archive className="w-4 h-4 mr-1" /> Arquivar
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => softDeleteNotification(n.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main View ──
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Todas lidas"} · Comunicados e resultados de testes
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
        </div>
      </div>

      {/* Search */}
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

      {/* Tabs */}
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

        <TabsContent value="inbox">{renderList(searched)}</TabsContent>
        <TabsContent value="archived">{renderList(searched)}</TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Configurações de Notificações
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={savePrefs} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label>E-mail para receber notificações</Label>
              <Input
                type="email"
                placeholder="gestor@exemplo.com"
                value={prefs.email_notifications_to}
                onChange={(e) => setPrefs({ ...prefs, email_notifications_to: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para não receber por e-mail.
              </p>
            </div>

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

            <div className="space-y-3">
              <Label className="text-base">Receber notificações de:</Label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={prefs.notify_test_completion}
                  onCheckedChange={(c) => setPrefs({ ...prefs, notify_test_completion: !!c })}
                />
                <div>
                  <p className="text-sm font-medium">Conclusão de testes</p>
                  <p className="text-xs text-muted-foreground">Quando um colaborador/paciente conclui DISC, MBTI, Temperamento ou Eneagrama</p>
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
      <div className="border border-border rounded-xl overflow-hidden bg-card">
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
              <div className="flex items-center gap-2 mb-0.5">
                {getSourceBadge(n)}
                {n.scoreSummary && (
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-mono">
                    {n.scoreSummary.label}
                  </Badge>
                )}
              </div>
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
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => softDeleteNotification(n.id)} title="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
