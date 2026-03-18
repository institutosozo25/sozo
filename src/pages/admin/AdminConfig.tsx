import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings, Database, Mail, CreditCard, HardDrive, CheckCircle2, XCircle,
  Loader2, Info, RefreshCw, Save, Plus, Trash2, Star, MessageSquareQuote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSiteSettings, useTestimonials, type Testimonial } from "@/hooks/useSiteContent";

type TestStatus = "idle" | "loading" | "ok" | "error" | "info";

interface TestResult {
  status: TestStatus;
  message?: string;
  details?: Record<string, unknown>;
}

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === "idle") return null;
  if (status === "loading") return <Badge variant="outline" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Testando...</Badge>;
  if (status === "ok") return <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3" />Conectado</Badge>;
  if (status === "info") return <Badge variant="outline" className="gap-1 border-blue-200 text-blue-600"><Info className="w-3 h-3" />Info</Badge>;
  return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Erro</Badge>;
}

// ─── Contact Settings Section ───
function ContactSettingsSection() {
  const { data: settings, isLoading } = useSiteSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const settingsKeys = [
    { key: "contact_email", label: "E-mail de contato" },
    { key: "contact_phone", label: "Telefone (exibição)" },
    { key: "contact_whatsapp", label: "WhatsApp (apenas números, ex: 5511999990000)" },
    { key: "contact_address", label: "Endereço" },
    { key: "contact_city", label: "Cidade / Estado / CEP" },
    { key: "contact_hours", label: "Horário de atendimento" },
    { key: "social_instagram", label: "Instagram (URL)" },
    { key: "social_facebook", label: "Facebook (URL)" },
    { key: "social_linkedin", label: "LinkedIn (URL)" },
    { key: "social_youtube", label: "YouTube (URL)" },
    { key: "hero_stats_users", label: "Estatística: Usuários ativos" },
    { key: "hero_stats_tests", label: "Estatística: Testes realizados" },
    { key: "hero_stats_companies", label: "Estatística: Empresas atendidas" },
  ];

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const { key } of settingsKeys) {
        const value = form[key] ?? "";
        const { error } = await supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Salvo!", description: "Configurações atualizadas com sucesso." });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao salvar configurações.", variant: "destructive" });
    }
    setSaving(false);
  };

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin mx-auto my-8" />;

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Configurações do Site</CardTitle>
            <CardDescription>Contato, redes sociais e estatísticas da página inicial</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {settingsKeys.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                value={form[key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={label}
              />
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Testimonials Section ───
function TestimonialsManagement() {
  const { data: testimonials, isLoading } = useTestimonials();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    name: "", role: "", content: "", image_url: "", rating: 5,
  });

  const handleAdd = async () => {
    if (!newTestimonial.name || !newTestimonial.role || !newTestimonial.content) {
      toast({ title: "Erro", description: "Preencha nome, cargo e depoimento.", variant: "destructive" });
      return;
    }
    setAdding(true);
    const maxOrder = Math.max(0, ...(testimonials?.map((t) => t.display_order) ?? []));
    const { error } = await supabase.from("testimonials").insert({
      name: newTestimonial.name,
      role: newTestimonial.role,
      content: newTestimonial.content,
      image_url: newTestimonial.image_url || null,
      rating: newTestimonial.rating,
      display_order: maxOrder + 1,
      is_active: true,
    });
    if (error) {
      toast({ title: "Erro", description: "Falha ao adicionar depoimento.", variant: "destructive" });
    } else {
      toast({ title: "Adicionado!", description: "Depoimento criado com sucesso." });
      setNewTestimonial({ name: "", role: "", content: "", image_url: "", rating: 5 });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: "Falha ao remover.", variant: "destructive" });
    } else {
      toast({ title: "Removido" });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase.from("testimonials").update({ is_active: !isActive }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <MessageSquareQuote className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <CardTitle className="text-lg">Depoimentos</CardTitle>
            <CardDescription>Gerencie os feedbacks exibidos na página inicial</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing testimonials */}
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        ) : (
          <div className="space-y-3">
            {testimonials?.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                {t.image_url && (
                  <img src={t.image_url} alt={t.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-foreground">{t.name}</span>
                    <span className="text-xs text-muted-foreground">— {t.role}</span>
                    {!t.is_active && <Badge variant="outline" className="text-xs">Oculto</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">"{t.content}"</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(t.id, t.is_active)}>
                    {t.is_active ? "Ocultar" : "Exibir"}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {testimonials?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">Nenhum depoimento cadastrado.</p>
            )}
          </div>
        )}

        {/* Add new */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" /> Adicionar Depoimento
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input
                value={newTestimonial.name}
                onChange={(e) => setNewTestimonial((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nome do cliente"
                maxLength={100}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cargo / Profissão *</Label>
              <Input
                value={newTestimonial.role}
                onChange={(e) => setNewTestimonial((p) => ({ ...p, role: e.target.value }))}
                placeholder="Ex: Psicóloga Clínica"
                maxLength={100}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Depoimento *</Label>
            <Textarea
              value={newTestimonial.content}
              onChange={(e) => setNewTestimonial((p) => ({ ...p, content: e.target.value }))}
              placeholder="Texto do depoimento..."
              maxLength={500}
              rows={3}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">URL da foto (opcional)</Label>
              <Input
                value={newTestimonial.image_url}
                onChange={(e) => setNewTestimonial((p) => ({ ...p, image_url: e.target.value }))}
                placeholder="https://..."
                maxLength={500}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estrelas (1-5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={newTestimonial.rating}
                onChange={(e) => setNewTestimonial((p) => ({ ...p, rating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) }))}
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={adding} className="gap-2">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar Depoimento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function AdminConfig() {
  const { toast } = useToast();

  const [asaasResult, setAsaasResult] = useState<TestResult>({ status: "idle" });
  const [driveResult, setDriveResult] = useState<TestResult>({ status: "idle" });
  const [smtpResult, setSmtpResult] = useState<TestResult>({ status: "idle" });
  const [dbResult, setDbResult] = useState<TestResult>({ status: "idle" });

  const runAction = async (action: string, setter: (r: TestResult) => void) => {
    setter({ status: "loading" });
    try {
      const { data, error } = await supabase.functions.invoke("admin-config", { body: { action } });
      if (error) {
        setter({ status: "error", message: error.message });
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
      const status: TestStatus = data.status === "ok" ? "ok" : data.status === "info" ? "info" : "error";
      setter({ status, message: data.message, details: data.details });
      if (status === "ok") toast({ title: "Sucesso", description: data.message });
      else if (status === "error") toast({ title: "Erro", description: data.message, variant: "destructive" });
      else toast({ title: "Informação", description: data.message });
    } catch {
      setter({ status: "error", message: "Erro de conexão" });
      toast({ title: "Erro", description: "Falha na conexão com o servidor", variant: "destructive" });
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Configurações</h1>
      <p className="text-muted-foreground mb-8">Gerencie integrações, conteúdo do site e depoimentos.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Asaas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sozo-green/10">
                  <CreditCard className="w-5 h-5 text-sozo-green" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pagamentos (Asaas)</CardTitle>
                  <CardDescription>Gateway de pagamentos Pix e Cartão</CardDescription>
                </div>
              </div>
              <StatusBadge status={asaasResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {asaasResult.message && (
              <p className={`text-sm ${asaasResult.status === "ok" ? "text-emerald-600" : asaasResult.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {asaasResult.message}
              </p>
            )}
            {asaasResult.details && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>Ambiente:</strong> {String(asaasResult.details.env)}</p>
                <p><strong>Saldo:</strong> R$ {Number(asaasResult.details.balance).toFixed(2)}</p>
              </div>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={() => runAction("test-asaas", setAsaasResult)} disabled={asaasResult.status === "loading"}>
              {asaasResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Testar Conexão
            </Button>
          </CardContent>
        </Card>

        {/* Google Drive */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <HardDrive className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Drive</CardTitle>
                  <CardDescription>Armazenamento de relatórios e laudos</CardDescription>
                </div>
              </div>
              <StatusBadge status={driveResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {driveResult.message && (
              <p className={`text-sm ${driveResult.status === "ok" ? "text-emerald-600" : driveResult.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {driveResult.message}
              </p>
            )}
            {driveResult.details && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>Pasta:</strong> {String(driveResult.details.folderName)}</p>
                <p><strong>ID:</strong> {String(driveResult.details.folderId)}</p>
              </div>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={() => runAction("test-google-drive", setDriveResult)} disabled={driveResult.status === "loading"}>
              {driveResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Testar Conexão
            </Button>
          </CardContent>
        </Card>

        {/* SMTP */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Mail className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">E-mail / SMTP</CardTitle>
                  <CardDescription>Envio de e-mails transacionais</CardDescription>
                </div>
              </div>
              <StatusBadge status={smtpResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {smtpResult.message && (
              <p className="text-sm text-muted-foreground">{smtpResult.message}</p>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={() => runAction("test-smtp", setSmtpResult)} disabled={smtpResult.status === "loading"}>
              {smtpResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Verificar Status
            </Button>
          </CardContent>
        </Card>

        {/* DB Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Banco de Dados</CardTitle>
                  <CardDescription>Estatísticas dos dados</CardDescription>
                </div>
              </div>
              <StatusBadge status={dbResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dbResult.details && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>Perfis:</strong> {String(dbResult.details.profiles)}</p>
                <p><strong>Submissões:</strong> {String(dbResult.details.submissions)}</p>
                <p><strong>Pagamentos:</strong> {String(dbResult.details.payments)}</p>
                <p><strong>Empresas:</strong> {String(dbResult.details.empresas)}</p>
                <p><strong>Avaliações MAPSO:</strong> {String(dbResult.details.mapso_assessments)}</p>
              </div>
            )}
            <Button variant="outline" className="w-full gap-2" onClick={() => runAction("get-db-stats", setDbResult)} disabled={dbResult.status === "loading"}>
              {dbResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Carregar Estatísticas
            </Button>
          </CardContent>
        </Card>

        {/* Contact & Site Settings */}
        <ContactSettingsSection />

        {/* Testimonials */}
        <TestimonialsManagement />
      </div>
    </div>
  );
}
