import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import {
  Users, BarChart3, Copy, ExternalLink, Share2, Mail,
  FileText, Download, Loader2, CheckCircle2, Clock, AlertTriangle, Shield, LinkIcon, ClipboardList,
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
  const { toast } = useToast();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaName, setEmpresaName] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [assessments, setAssessments] = useState<MapsoAssessment[]>([]);
  const [activeLink, setActiveLink] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: emp } = await supabase.from("empresas").select("id, razao_social").eq("profile_id", user!.id).single();
    if (!emp) { setLoading(false); return; }
    setEmpresaId(emp.id);
    setEmpresaName(emp.razao_social || "Empresa");

    const [colabRes, setoresRes, assessRes, linkRes] = await Promise.all([
      supabase.from("colaboradores").select("id, nome, setor_id").eq("empresa_id", emp.id),
      supabase.from("setores").select("id, nome").eq("empresa_id", emp.id),
      supabase.from("mapso_assessments").select("*").eq("empresa_id", emp.id).order("created_at", { ascending: false }),
      supabase
        .from("shared_test_links")
        .select("*")
        .eq("created_by", user!.id)
        .eq("test_type", "mapso")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    setColaboradores((colabRes.data as any[]) || []);
    setSetores((setoresRes.data as any[]) || []);
    setAssessments((assessRes.data as any[]) || []);
    if (linkRes.data && linkRes.data.length > 0) setActiveLink(linkRes.data[0] as any);

    setLoading(false);
  };

  const generateLink = async () => {
    if (!user || !empresaId) return;
    setIsGenerating(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);

      const { data, error } = await supabase
        .from("shared_test_links")
        .insert({
          test_type: "mapso",
          created_by: user.id,
          empresa_id: empresaId,
          expires_at: expiresAt.toISOString(),
        })
        .select("*")
        .single();

      if (error) throw error;
      setActiveLink(data as any);
    } catch (e) {
      console.error("Error generating link:", e);
      toast({ title: "Erro ao gerar link", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const getLinkUrl = () => {
    if (!activeLink) return "";
    return `${window.location.origin}/teste/respond/${activeLink.token}`;
  };

  const copyToClipboard = async () => {
    const url = getLinkUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    sonnerToast.success("Link copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    const url = getLinkUrl();
    const message = encodeURIComponent(
      `Olá! Você foi convidado(a) a responder a avaliação *MAPSO — Diagnóstico de Riscos Psicossociais (NR1)* na plataforma Plenitude Sozo.\n\nAcesse o link abaixo para iniciar:\n${url}\n\nVocê precisará informar seu CPF e data de nascimento para validar sua identidade.\n\nO link expira em 3 dias.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareEmail = () => {
    const url = getLinkUrl();
    const subject = encodeURIComponent("Avaliação MAPSO — Diagnóstico de Riscos Psicossociais (NR1)");
    const body = encodeURIComponent(
      `Olá,\n\nVocê foi convidado(a) a responder a avaliação MAPSO — Diagnóstico de Riscos Psicossociais (NR1) na plataforma Plenitude Sozo.\n\nAcesse o link abaixo para iniciar:\n${url}\n\nVocê precisará informar seu CPF e data de nascimento para validar sua identidade.\n\nO link expira em 3 dias.\n\nAtenciosamente,\n${empresaName}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // Stats
  const colaboradoresCount = colaboradores.length;
  const completedColabIds = new Set(
    assessments.map((a) => (a as any).colaborador_id || a.employee_id).filter(Boolean)
  );
  const completedCount = completedColabIds.size;
  const pendingCount = colaboradoresCount - completedCount;
  const completionRate = colaboradoresCount > 0 ? (completedCount / colaboradoresCount) * 100 : 0;
  const allCompleted = colaboradoresCount > 0 && completedCount >= colaboradoresCount;

  // Per-colaborador status
  const colaboradorStatus = useMemo(() => {
    return colaboradores.map((c) => {
      const done = completedColabIds.has(c.id);
      const setorNome = c.setor_id ? setores.find((s) => s.id === c.setor_id)?.nome : null;
      return { ...c, done, setorNome };
    });
  }, [colaboradores, completedColabIds, setores]);

  // Sector breakdown
  const sectorStats = useMemo(() => {
    const sectors: Record<string, { total: number; totalIrp: number }> = {};
    for (const a of assessments) {
      const dept = a.organization_department || "Sem setor";
      if (!sectors[dept]) sectors[dept] = { total: 0, totalIrp: 0 };
      sectors[dept].total++;
      sectors[dept].totalIrp += a.irp;
    }
    return Object.entries(sectors).map(([name, data]) => ({
      name,
      total: data.total,
      averageIrp: data.total > 0 ? Math.round(data.totalIrp / data.total) : null,
      riskLabel: data.total > 0 ? getRiskClassification(data.totalIrp / data.total).label : "—",
    }));
  }, [assessments]);

  // Build consolidated result for reports
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
      const dim = assessments[0].dimension_scores?.find((d: any) => d.id === id);
      return {
        dimensionId: id,
        name: dim?.name || id,
        shortName: dim?.name || id,
        rawMean: 0,
        standardizedScore: 0,
        riskScore: avg,
        classification,
        weight: 1 / Object.keys(allDimScores).length,
      };
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

    return {
      result,
      orgInfo: {
        name: empresaName,
        sector: "Corporativo",
        department: "Consolidado",
        employeeCount: String(assessments.length),
      },
    };
  };

  const downloadPdf = async (html: string, filename: string) => {
    setDownloading(filename);
    try {
      await downloadHtmlAsPdf(html, filename);
      if (empresaId) {
        uploadPdfToStorage(html, empresaId, filename).catch(() => {});
      }
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
    const html = generateDiagnosisHtml(data.result, data.orgInfo);
    downloadPdf(html, `Diagnostico_MAPSO_${empresaName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleDownloadNR1 = () => {
    const data = buildConsolidatedResult();
    if (!data) return;
    const html = generateNR1ReportHtml(data.result, data.orgInfo);
    downloadPdf(html, `Relatorio_NR1_${empresaName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleDownloadActionPlan = () => {
    const data = buildConsolidatedResult();
    if (!data) return;
    const plan = generateActionPlan(data.result);
    const html = generateActionPlanHtml(empresaName, plan, data.result);
    downloadPdf(html, `Plano_de_Acao_MAPSO_${empresaName.replace(/\s+/g, "_")}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{colaboradoresCount}</p>
                <p className="text-xs text-muted-foreground">Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2 text-accent"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Respostas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 p-2 text-secondary"><Clock className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount > 0 ? pendingCount : 0}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><BarChart3 className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{Math.round(completionRate)}%</p>
                <p className="text-xs text-muted-foreground">Conclusão</p>
              </div>
            </div>
            <Progress value={completionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Anonymity banner */}
      {!allCompleted && colaboradoresCount > 0 && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 shrink-0 text-accent mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm">Resultados bloqueados — Anonimato garantido</p>
            <p className="text-xs text-muted-foreground mt-1">
              Para preservar o anonimato dos colaboradores, os diagnósticos consolidados e relatórios só serão
              liberados quando <strong>100% dos colaboradores</strong> tiverem respondido ({completedCount}/{colaboradoresCount}).
            </p>
          </div>
        </div>
      )}

      {/* Generate / Share Link */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Aplicar Teste MAPSO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Gere um link genérico e compartilhe com seus colaboradores. Eles precisarão informar CPF e data de nascimento para validar a identidade antes de iniciar o teste. O link expira em 3 dias.
          </p>

          {colaboradoresCount === 0 ? (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm text-foreground font-medium">⚠️ Cadastre colaboradores primeiro</p>
              <p className="text-xs text-muted-foreground mt-1">
                Antes de gerar o link do MAPSO, cadastre seus colaboradores na seção "Colaboradores" do menu lateral com CPF e data de nascimento.
              </p>
            </div>
          ) : activeLink ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{getLinkUrl()}</span>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyToClipboard} variant="outline">
                  <Copy className="w-4 h-4 mr-2" /> {copied ? "Copiado!" : "Copiar Link"}
                </Button>
                <Button onClick={shareWhatsApp} className="bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white">
                  <ExternalLink className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button onClick={shareEmail} variant="outline">
                  <Mail className="w-4 h-4 mr-2" /> E-mail
                </Button>
                <Button variant="ghost" onClick={generateLink} disabled={isGenerating}>
                  Gerar novo link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expira em {new Date(activeLink.expires_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ) : (
            <Button onClick={generateLink} disabled={isGenerating} size="lg">
              <LinkIcon className="w-4 h-4 mr-2" />
              {isGenerating ? "Gerando..." : "Gerar Link de Acesso (72h)"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Progress + Sectors + Reports */}
      <Tabs defaultValue="progress">
        <TabsList className="mb-4">
          <TabsTrigger value="progress">Acompanhamento</TabsTrigger>
          <TabsTrigger value="sectors" disabled={!allCompleted}>
            Diagnóstico por Setor {!allCompleted && "🔒"}
          </TabsTrigger>
          <TabsTrigger value="reports" disabled={!allCompleted}>
            Relatórios {!allCompleted && "🔒"}
          </TabsTrigger>
        </TabsList>

        {/* Progress Tab — per-colaborador tracking */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Progresso de Participação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {colaboradoresCount === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Cadastre colaboradores na seção "Colaboradores" para acompanhar o progresso.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Progresso geral</span>
                    <span className="text-sm font-medium text-foreground">{completedCount} de {colaboradoresCount} responderam</span>
                  </div>
                  <Progress value={completionRate} className="h-3" />

                  {/* Per-colaborador list */}
                  <div className="mt-4 space-y-2">
                    {colaboradorStatus.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`rounded-full p-1 ${c.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {c.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-foreground text-sm block truncate">{c.nome || "Sem nome"}</span>
                            {c.setorNome && (
                              <span className="text-xs text-muted-foreground">{c.setorNome}</span>
                            )}
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sectors Tab */}
        <TabsContent value="sectors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Diagnóstico por Setor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sectorStats.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum dado de setor disponível ainda.</p>
              ) : (
                <div className="space-y-3">
                  {sectorStats.map((sector) => (
                    <div key={sector.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <div className="font-medium text-foreground">{sector.name}</div>
                        <div className="text-xs text-muted-foreground">{sector.total} respondentes</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sector.averageIrp !== null ? (
                          <Badge
                            variant="outline"
                            className={
                              sector.averageIrp > 60 ? "border-destructive text-destructive" :
                              sector.averageIrp > 40 ? "border-accent text-accent" :
                              "border-primary text-primary"
                            }
                          >
                            IRP: {sector.averageIrp} — {sector.riskLabel}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Aguardando respostas</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab — 3 documents */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Relatórios Consolidados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Nenhuma avaliação finalizada. Os relatórios serão gerados quando todos os colaboradores completarem o teste.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* 1. Diagnóstico */}
                  <Button
                    variant="outline"
                    className="h-auto gap-3 p-6 flex-col items-start"
                    onClick={handleDownloadDiagnosis}
                    disabled={downloading !== null}
                  >
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      {downloading?.includes("Diagnostico") ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Diagnóstico MAPSO</div>
                      <div className="text-xs text-muted-foreground">Como está a empresa — {assessments.length} respondentes</div>
                    </div>
                  </Button>

                  {/* 2. Laudo NR1 */}
                  <Button
                    variant="outline"
                    className="h-auto gap-3 p-6 flex-col items-start"
                    onClick={handleDownloadNR1}
                    disabled={downloading !== null}
                  >
                    <div className="rounded-lg bg-accent/10 p-3 text-accent">
                      {downloading?.includes("NR1") ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileText className="h-6 w-6" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Laudo NR1</div>
                      <div className="text-xs text-muted-foreground">Documento válido para fiscalização</div>
                    </div>
                  </Button>

                  {/* 3. Plano de Ação */}
                  <Button
                    variant="outline"
                    className="h-auto gap-3 p-6 flex-col items-start"
                    onClick={handleDownloadActionPlan}
                    disabled={downloading !== null}
                  >
                    <div className="rounded-lg bg-secondary/10 p-3 text-secondary">
                      {downloading?.includes("Plano") ? <Loader2 className="h-6 w-6 animate-spin" /> : <ClipboardList className="h-6 w-6" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Plano de Ação</div>
                      <div className="text-xs text-muted-foreground">O que fazer após o diagnóstico</div>
                    </div>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Standalone Action Plan HTML generator ───
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
  h2 { color: #0f3460; margin-top: 30px; font-size: 18px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th, td { padding: 10px; border: 1px solid #ddd; }
  th { background: #f8f9fa; text-align: left; font-weight: 600; }
  .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #0f3460, #533483); color: white; border-radius: 12px; }
  .header h1 { color: white; border: none; margin: 0; font-size: 20px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #888; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
  <div class="header">
    <h1>PLANO DE AÇÃO — RISCOS PSICOSSOCIAIS</h1>
    <p style="margin:8px 0 0;opacity:0.9;">${orgName}</p>
  </div>

  <h1>1. Objetivo</h1>
  <p>Este plano de ação visa mitigar os fatores de risco psicossociais identificados na avaliação MAPSO realizada na empresa <strong>${orgName}</strong>, em conformidade com a NR-1 e NR-17.</p>

  <h1>2. Resultados da Avaliação</h1>
  <p><strong>IRP (Índice de Risco Psicossocial):</strong> ${result.irp}/100 — ${result.irpClassification.label}</p>
  <p><strong>Dimensões em risco elevado (IVO):</strong> ${result.ivo}/8</p>
  <p><strong>Data da avaliação:</strong> ${date}</p>

  <h1>3. Ações Recomendadas</h1>
  ${plan.length === 0 ? "<p>Nenhuma ação urgente identificada. Recomenda-se manter monitoramento preventivo.</p>" : `
  <table>
    <thead>
      <tr><th>#</th><th>Fator de Risco</th><th>Ação Recomendada</th><th style="text-align:center;">Responsável</th><th style="text-align:center;">Prazo</th><th style="text-align:center;">Prioridade</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`}

  <h1>4. Acompanhamento</h1>
  <p>Recomenda-se reaplicar a avaliação MAPSO em <strong>90 dias</strong> para monitorar a eficácia das ações implementadas e ajustar o plano conforme necessário.</p>

  <div class="footer">
    <p>© Instituto Plenitude SOZO — Plano de Ação gerado via MAPSO</p>
    <p>Documento complementar ao Relatório NR1</p>
  </div>
</body></html>`;
}
