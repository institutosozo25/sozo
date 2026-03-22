import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import {
  Users, BarChart3, Copy, ExternalLink, Mail,
  FileText, Download, Loader2, CheckCircle2, Clock, Shield, LinkIcon,
  ClipboardList, Play, History, MessageSquare, Save,
} from "lucide-react";
import { downloadHtmlAsPdf, uploadPdfToStorage } from "@/lib/pdf-generator";
import { generateDiagnosisHtml, generateNR1ReportHtml } from "@/modules/mapso/lib/nr1-report-generator";
import { generateActionPlan } from "@/modules/mapso/lib/action-plan-generator";
import { getRiskClassification } from "@/modules/mapso/data/miarpo-questionnaire";
import type { AssessmentResult, DimensionResult } from "@/modules/mapso/lib/miarpo-engine";

interface SharedLink {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  observation: string | null;
  link_duration_hours: number | null;
}

interface MapsoAssessment {
  id: string;
  colaborador_id: string | null;
  employee_id: string | null;
  irp: number;
  irp_classification: string;
  ipp: number;
  ivo: number;
  dimension_scores: any;
  created_at: string;
  organization_department: string | null;
}

interface Colaborador {
  id: string;
  nome: string | null;
  setor_id: string | null;
}

interface Setor {
  id: string;
  nome: string;
}

export default function DashboardEmpresaMapso() {
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaName, setEmpresaName] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [assessments, setAssessments] = useState<MapsoAssessment[]>([]);
  const [activeLink, setActiveLink] = useState<SharedLink | null>(null);
  const [pastLinks, setPastLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("72");
  const [observation, setObservation] = useState("");
  const [savingObs, setSavingObs] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: emp } = await supabase.from("empresas").select("id, razao_social").eq("profile_id", user.id).single();
    if (!emp) { setLoading(false); return; }
    setEmpresaId(emp.id);
    setEmpresaName(emp.razao_social || "Empresa");

    const [colabRes, setoresRes, assessRes, linkRes] = await Promise.all([
      supabase.from("colaboradores").select("id, nome, setor_id").eq("empresa_id", emp.id),
      supabase.from("setores").select("id, nome").eq("empresa_id", emp.id),
      supabase.from("mapso_assessments").select("*").eq("empresa_id", emp.id).order("created_at", { ascending: false }),
      supabase.from("shared_test_links").select("*").eq("created_by", user.id).eq("test_type", "mapso").order("created_at", { ascending: false }),
    ]);

    setColaboradores((colabRes.data as any[]) || []);
    setSetores((setoresRes.data as any[]) || []);
    setAssessments((assessRes.data as any[]) || []);

    const allLinks = (linkRes.data || []) as unknown as SharedLink[];
    const active = allLinks.find((l) => l.status === "active" && new Date(l.expires_at) > new Date());
    setActiveLink(active || null);
    if (active) setObservation(active.observation || "");
    setPastLinks(allLinks.filter((l) => l !== active));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription for assessments
  useEffect(() => {
    if (!empresaId) return;
    const channel = supabase
      .channel(`mapso-realtime-${empresaId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "mapso_assessments",
        filter: `empresa_id=eq.${empresaId}`,
      }, (payload) => {
        setAssessments((prev) => [payload.new as MapsoAssessment, ...prev]);
        sonnerToast.success("Novo respondente concluiu o MAPSO!");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [empresaId]);

  const generateLink = async () => {
    if (!user || !empresaId) return;
    setIsGenerating(true);
    try {
      const hours = parseInt(selectedDuration);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);

      const { data, error } = await supabase
        .from("shared_test_links")
        .insert({
          test_type: "mapso",
          created_by: user.id,
          empresa_id: empresaId,
          expires_at: expiresAt.toISOString(),
          observation: observation.trim() || null,
          link_duration_hours: hours,
        } as any)
        .select("*")
        .single();

      if (error) throw error;
      setActiveLink(data as unknown as SharedLink);
      sonnerToast.success("Processo MAPSO iniciado!");
    } catch (e) {
      console.error("Error generating link:", e);
      sonnerToast.error("Erro ao iniciar processo");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveObservation = async () => {
    if (!activeLink) return;
    setSavingObs(true);
    try {
      await supabase
        .from("shared_test_links")
        .update({ observation: observation.trim() || null } as any)
        .eq("id", activeLink.id);
      sonnerToast.success("Observação salva!");
    } catch {
      sonnerToast.error("Erro ao salvar observação");
    } finally {
      setSavingObs(false);
    }
  };

  const getLinkUrl = () => {
    if (!activeLink) return "";
    return `${window.location.origin}/teste/respond/${activeLink.token}`;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getLinkUrl());
    setCopied(true);
    sonnerToast.success("Link copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    const url = getLinkUrl();
    const message = encodeURIComponent(
      `Olá! Você foi convidado(a) a responder a avaliação *MAPSO — Diagnóstico de Riscos Psicossociais (NR1)* na plataforma Plenitude Sozo.\n\nAcesse o link abaixo para iniciar:\n${url}\n\nVocê precisará informar seu CPF e data de nascimento para validar sua identidade.\n\nO link expira em ${selectedDuration} horas.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareEmail = () => {
    const url = getLinkUrl();
    const subject = encodeURIComponent("Avaliação MAPSO — Diagnóstico de Riscos Psicossociais (NR1)");
    const body = encodeURIComponent(
      `Olá,\n\nVocê foi convidado(a) a responder a avaliação MAPSO na plataforma Plenitude Sozo.\n\nAcesse o link abaixo:\n${url}\n\nO link expira em ${selectedDuration} horas.\n\nAtenciosamente,\n${empresaName}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // Stats
  const colaboradoresCount = colaboradores.length;
  const completedColabIds = new Set(
    assessments.map((a) => a.colaborador_id || a.employee_id).filter(Boolean)
  );
  const completedCount = completedColabIds.size;
  const completionRate = colaboradoresCount > 0 ? (completedCount / colaboradoresCount) * 100 : 0;
  const allCompleted = colaboradoresCount > 0 && completedCount >= colaboradoresCount;

  const colaboradorStatus = useMemo(() => {
    return colaboradores.map((c) => {
      const done = completedColabIds.has(c.id);
      const setorNome = c.setor_id ? setores.find((s) => s.id === c.setor_id)?.nome : null;
      return { ...c, done, setorNome };
    });
  }, [colaboradores, completedColabIds, setores]);

  const buildConsolidatedResult = (): { result: AssessmentResult; orgInfo: any } | null => {
    if (assessments.length === 0) return null;
    const allDimScores: Record<string, number[]> = {};
    for (const a of assessments) {
      const scores = a.dimension_scores as any[];
      if (!scores) continue;
      for (const s of scores) {
        if (!allDimScores[s.id]) allDimScores[s.id] = [];
        allDimScores[s.id].push(s.score);
      }
    }
    const dimensions: DimensionResult[] = Object.entries(allDimScores).map(([id, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const classification = getRiskClassification(avg);
      const dim = (assessments[0].dimension_scores as any[])?.find((d: any) => d.id === id);
      return { dimensionId: id, name: dim?.name || id, shortName: dim?.name || id, rawMean: 0, standardizedScore: 0, riskScore: avg, classification, weight: 1 / Object.keys(allDimScores).length };
    });
    const irp = assessments.reduce((s, a) => s + a.irp, 0) / assessments.length;
    const result: AssessmentResult = {
      irp: Math.round(irp * 10) / 10,
      irpClassification: getRiskClassification(irp),
      ipp: Math.round((100 - irp) * 10) / 10,
      ivo: dimensions.filter((d) => d.riskScore > 60).length,
      dimensions,
      totalRespondents: assessments.length,
      completedAt: new Date().toISOString(),
    };
    return { result, orgInfo: { name: empresaName, sector: "Corporativo", department: "Consolidado", employeeCount: String(assessments.length) } };
  };

  const downloadPdf = async (html: string, filename: string) => {
    setDownloading(filename);
    try {
      await downloadHtmlAsPdf(html, filename);
      if (empresaId) uploadPdfToStorage(html, empresaId, filename).catch(() => {});
      sonnerToast.success("PDF baixado!");
    } catch {
      sonnerToast.error("Erro ao gerar PDF");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadDiagnosis = () => {
    const data = buildConsolidatedResult();
    if (!data) return;
    downloadPdf(generateDiagnosisHtml(data.result, data.orgInfo), `Diagnostico_MAPSO_${empresaName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleDownloadNR1 = () => {
    const data = buildConsolidatedResult();
    if (!data) return;
    downloadPdf(generateNR1ReportHtml(data.result, data.orgInfo), `Relatorio_NR1_${empresaName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleDownloadActionPlan = () => {
    const data = buildConsolidatedResult();
    if (!data) return;
    const plan = generateActionPlan(data.result);
    downloadPdf(generateActionPlanHtml(empresaName, plan, data.result), `Plano_de_Acao_MAPSO_${empresaName.replace(/\s+/g, "_")}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine current view state
  const hasActiveProcess = !!activeLink;
  const isExpired = activeLink ? new Date(activeLink.expires_at) < new Date() : false;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">MAPSO — Gestão NR1</h1>
          <p className="text-muted-foreground text-sm">{empresaName} · Diagnóstico de Riscos Psicossociais</p>
        </div>
      </div>

      {/* ─── STATE 1: No active process — Show "Iniciar Processo" ─── */}
      {(!hasActiveProcess || isExpired) && !allCompleted && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" /> Iniciar Processo MAPSO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {colaboradoresCount === 0 ? (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                <p className="text-sm text-foreground font-medium">⚠️ Cadastre colaboradores primeiro</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Antes de iniciar o MAPSO, cadastre seus colaboradores na seção "Colaboradores" do menu lateral com CPF e data de nascimento.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Inicie uma nova avaliação de riscos psicossociais. Um link será gerado para que os {colaboradoresCount} colaboradores respondam dentro do prazo definido.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Duração do link</label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 horas</SelectItem>
                        <SelectItem value="48">48 horas</SelectItem>
                        <SelectItem value="72">72 horas (recomendado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Observação <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <Textarea
                      placeholder="Ex: Avaliação trimestral Q1 2026..."
                      value={observation}
                      onChange={(e) => setObservation(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                <Button onClick={generateLink} disabled={isGenerating} size="lg" className="w-full sm:w-auto">
                  <Play className="w-4 h-4 mr-2" />
                  {isGenerating ? "Iniciando..." : "Iniciar Processo"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── STATE 2: Active process — Show "Teste em andamento" ─── */}
      {hasActiveProcess && !isExpired && !allCompleted && (
        <>
          {/* In-progress card */}
          <Card className="mb-6 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-4">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">Teste em andamento</h2>
                <p className="text-sm text-muted-foreground mb-4">Aguardando todos os respondentes</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {completedCount}/{colaboradoresCount} responderam
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Expira {new Date(activeLink!.expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <Progress value={completionRate} className="h-2 w-full max-w-md mt-4" />
              </div>
            </CardContent>
          </Card>

          {/* Share link */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Link de acesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border mb-3">
                <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{getLinkUrl()}</span>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" /> {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button onClick={shareWhatsApp} size="sm" className="bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">
                  <ExternalLink className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button onClick={shareEmail} variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" /> E-mail
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Observation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Observação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Avaliação trimestral Q1 2026..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="resize-none mb-3"
                rows={2}
              />
              <Button size="sm" variant="outline" onClick={saveObservation} disabled={savingObs}>
                <Save className="w-4 h-4 mr-2" /> {savingObs ? "Salvando..." : "Salvar observação"}
              </Button>
            </CardContent>
          </Card>

          {/* Real-time respondent list */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" /> Respondentes em tempo real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {colaboradorStatus.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`rounded-full p-1 ${c.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {c.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-foreground text-sm block truncate">{c.nome || "Sem nome"}</span>
                        {c.setorNome && <span className="text-xs text-muted-foreground">{c.setorNome}</span>}
                      </div>
                    </div>
                    <Badge
                      variant={c.done ? "default" : "outline"}
                      className={`text-xs shrink-0 ${c.done ? "bg-primary/10 text-primary border-primary/20" : ""}`}
                    >
                      {c.done ? "Concluído" : "Pendente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Anonymity banner */}
          <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 shrink-0 text-accent mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm">Resultados bloqueados — Anonimato garantido</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os relatórios só serão liberados quando <strong>100% dos colaboradores</strong> tiverem respondido ({completedCount}/{colaboradoresCount}).
              </p>
            </div>
          </div>
        </>
      )}

      {/* ─── STATE 3: All completed — Show results + history ─── */}
      {allCompleted && (
        <>
          {/* Success card */}
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1">Avaliação concluída!</h2>
                <p className="text-sm text-muted-foreground">Todos os {colaboradoresCount} colaboradores responderam. Seus relatórios estão prontos.</p>
              </div>
            </CardContent>
          </Card>

          {/* 3 PDF cards */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Relatórios Consolidados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Button variant="outline" className="h-auto gap-3 p-6 flex-col items-start" onClick={handleDownloadDiagnosis} disabled={downloading !== null}>
                  <div className="rounded-lg bg-primary/10 p-3 text-primary">
                    {downloading?.includes("Diagnostico") ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Diagnóstico MAPSO</div>
                    <div className="text-xs text-muted-foreground">{assessments.length} respondentes</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto gap-3 p-6 flex-col items-start" onClick={handleDownloadNR1} disabled={downloading !== null}>
                  <div className="rounded-lg bg-accent/10 p-3 text-accent">
                    {downloading?.includes("NR1") ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileText className="h-6 w-6" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Laudo NR1</div>
                    <div className="text-xs text-muted-foreground">Documento para fiscalização</div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto gap-3 p-6 flex-col items-start" onClick={handleDownloadActionPlan} disabled={downloading !== null}>
                  <div className="rounded-lg bg-secondary/10 p-3 text-secondary">
                    {downloading?.includes("Plano") ? <Loader2 className="h-6 w-6 animate-spin" /> : <ClipboardList className="h-6 w-6" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Plano de Ação</div>
                    <div className="text-xs text-muted-foreground">Ações pós-diagnóstico</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Histórico de Aplicações ─── */}
      {pastLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" /> Histórico de Aplicações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastLinks.map((link) => {
                const linkDate = new Date(link.created_at);
                const isLinkExpired = new Date(link.expires_at) < new Date();
                const linkAssessments = assessments.filter((a) => {
                  const aDate = new Date(a.created_at);
                  const linkExpiry = new Date(link.expires_at);
                  const linkStart = new Date(link.created_at);
                  return aDate >= linkStart && aDate <= linkExpiry;
                });

                return (
                  <div key={link.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isLinkExpired || link.status === "completed" ? "secondary" : "default"} className="text-xs">
                          {link.status === "completed" ? "Concluído" : isLinkExpired ? "Expirado" : "Ativo"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {linkDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} às {linkDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{linkAssessments.length} respostas</span>
                    </div>

                    {(link as any).observation && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{(link as any).observation}</span>
                      </div>
                    )}

                    {linkAssessments.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => {
                          const data = buildConsolidatedResult();
                          if (data) downloadPdf(generateDiagnosisHtml(data.result, data.orgInfo), `Diagnostico_${linkDate.toISOString().slice(0, 10)}.pdf`);
                        }} disabled={downloading !== null}>
                          <Download className="w-3 h-3" /> Diagnóstico
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => {
                          const data = buildConsolidatedResult();
                          if (data) downloadPdf(generateNR1ReportHtml(data.result, data.orgInfo), `NR1_${linkDate.toISOString().slice(0, 10)}.pdf`);
                        }} disabled={downloading !== null}>
                          <Download className="w-3 h-3" /> NR1
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => {
                          const data = buildConsolidatedResult();
                          if (data) {
                            const plan = generateActionPlan(data.result);
                            downloadPdf(generateActionPlanHtml(empresaName, plan, data.result), `Plano_${linkDate.toISOString().slice(0, 10)}.pdf`);
                          }
                        }} disabled={downloading !== null}>
                          <Download className="w-3 h-3" /> Plano de Ação
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Action Plan HTML generator ───
function generateActionPlanHtml(
  orgName: string,
  plan: { riskFactor: string; recommendedAction: string; responsible: string; deadline: string; priority: string }[],
  result: AssessmentResult
): string {
  const rows = plan
    .map(
      (a, i) => `
    <tr>
      <td style="padding:10px;border:1px solid #ddd;">${i + 1}</td>
      <td style="padding:10px;border:1px solid #ddd;font-weight:600;">${a.riskFactor}</td>
      <td style="padding:10px;border:1px solid #ddd;">${a.recommendedAction}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">${a.responsible}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">${a.deadline}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">
        <span style="background:${a.priority === "Urgente" ? "#e74c3c" : a.priority === "Alta" ? "#e67e22" : "#f39c12"}20;color:${a.priority === "Urgente" ? "#e74c3c" : a.priority === "Alta" ? "#e67e22" : "#f39c12"};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${a.priority}</span>
      </td>
    </tr>`
    )
    .join("");

  const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Plano de Ação — ${orgName}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.7; }
  h1 { color: #16213e; border-bottom: 3px solid #0f3460; padding-bottom: 10px; font-size: 22px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th, td { padding: 10px; border: 1px solid #ddd; }
  th { background: #f8f9fa; text-align: left; font-weight: 600; }
  .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #0f3460, #533483); color: white; border-radius: 12px; }
  .header h1 { color: white; border: none; margin: 0; font-size: 20px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #888; font-size: 12px; }
</style></head>
<body>
  <div class="header">
    <h1>PLANO DE AÇÃO — RISCOS PSICOSSOCIAIS</h1>
    <p style="margin:8px 0 0;opacity:0.9;">${orgName}</p>
  </div>
  <h1>1. Objetivo</h1>
  <p>Mitigar os fatores de risco psicossociais identificados na avaliação MAPSO da empresa <strong>${orgName}</strong>, em conformidade com a NR-1 e NR-17.</p>
  <h1>2. Resultados</h1>
  <p><strong>IRP:</strong> ${result.irp}/100 — ${result.irpClassification.label}</p>
  <p><strong>IVO:</strong> ${result.ivo}/8</p>
  <p><strong>Data:</strong> ${date}</p>
  <h1>3. Ações</h1>
  ${plan.length === 0 ? "<p>Nenhuma ação urgente. Manter monitoramento preventivo.</p>" : `
  <table><thead><tr><th>#</th><th>Fator</th><th>Ação</th><th style="text-align:center;">Responsável</th><th style="text-align:center;">Prazo</th><th style="text-align:center;">Prioridade</th></tr></thead><tbody>${rows}</tbody></table>`}
  <h1>4. Acompanhamento</h1>
  <p>Reaplicar a avaliação MAPSO em <strong>90 dias</strong>.</p>
  <div class="footer"><p>© Instituto Plenitude SOZO — Plano de Ação MAPSO</p></div>
</body></html>`;
}
