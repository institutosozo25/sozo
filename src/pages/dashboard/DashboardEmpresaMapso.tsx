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
  Users, BarChart3, Copy, ExternalLink, Share2,
  FileText, Download, Loader2, CheckCircle2, Clock, AlertTriangle, Shield, LinkIcon,
} from "lucide-react";
import { downloadHtmlAsPdf, uploadPdfToStorage } from "@/lib/pdf-generator";
import { generateDiagnosisHtml, generateNR1ReportHtml } from "@/modules/mapso/lib/nr1-report-generator";
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
  employee_id: string | null;
  irp: number;
  irp_classification: string;
  ipp: number;
  ivo: number;
  dimension_scores: any;
  created_at: string;
}

export default function DashboardEmpresaMapso() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaName, setEmpresaName] = useState("");
  const [colaboradoresCount, setColaboradoresCount] = useState(0);
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

    const [colabRes, assessRes, linkRes] = await Promise.all([
      supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("empresa_id", emp.id),
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

    setColaboradoresCount(colabRes.count || 0);
    setAssessments((assessRes.data as any[]) || []);
    if (linkRes.data && linkRes.data.length > 0) setActiveLink(linkRes.data[0] as any);

    setLoading(false);
  };

  const generateLink = async () => {
    if (!user || !empresaId) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from("shared_test_links")
        .insert({
          test_type: "mapso",
          created_by: user.id,
          empresa_id: empresaId,
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
    return `${window.location.origin}/teste/respond/${(activeLink as any).token}`;
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
      `Olá! Você foi convidado(a) a responder a avaliação *MAPSO — Diagnóstico de Riscos Psicossociais (NR1)* na plataforma Sozo.\n\nAcesse o link abaixo para iniciar:\n${url}\n\nVocê precisará informar seu CPF e data de nascimento para validar sua identidade.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  // Stats
  const completedCount = assessments.length;
  const pendingCount = colaboradoresCount - completedCount;
  const completionRate = colaboradoresCount > 0 ? (completedCount / colaboradoresCount) * 100 : 0;
  const allCompleted = colaboradoresCount > 0 && completedCount === colaboradoresCount;

  // Sector breakdown
  const sectorStats = useMemo(() => {
    // Group assessments by organization_department
    const sectors: Record<string, { total: number; totalIrp: number }> = {};
    for (const a of assessments) {
      const dept = (a as any).organization_department || "Sem setor";
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
            Gere um link genérico e compartilhe com seus colaboradores. Eles precisarão informar CPF e data de nascimento para validar a identidade antes de iniciar o teste.
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
                <Button onClick={shareWhatsApp} className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-accent-foreground">
                  <ExternalLink className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button variant="ghost" onClick={generateLink} disabled={isGenerating}>
                  Gerar novo link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expira em {new Date(activeLink.expires_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ) : (
            <Button onClick={generateLink} disabled={isGenerating} size="lg">
              <LinkIcon className="w-4 h-4 mr-2" />
              {isGenerating ? "Gerando..." : "Gerar Link de Acesso"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Sectors + Reports */}
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

        {/* Progress Tab */}
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
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="rounded-lg border p-4 text-center">
                      <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                      <p className="text-xs text-muted-foreground">Finalizaram</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-2xl font-bold text-foreground">{pendingCount > 0 ? pendingCount : 0}</p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
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
                        <div className="text-xs text-muted-foreground">
                          {sector.total} respondentes
                        </div>
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

        {/* Reports Tab */}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto gap-3 p-6"
                    onClick={handleDownloadDiagnosis}
                    disabled={downloading !== null}
                  >
                    <div className="rounded-lg bg-primary/10 p-3 text-primary">
                      {downloading?.includes("Diagnostico") ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Diagnóstico MAPSO</div>
                      <div className="text-xs text-muted-foreground">PDF consolidado com {assessments.length} respondentes</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto gap-3 p-6"
                    onClick={handleDownloadNR1}
                    disabled={downloading !== null}
                  >
                    <div className="rounded-lg bg-accent/10 p-3 text-accent">
                      {downloading?.includes("NR1") ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileText className="h-6 w-6" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Relatório NR1</div>
                      <div className="text-xs text-muted-foreground">Relatório técnico completo para conformidade</div>
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
