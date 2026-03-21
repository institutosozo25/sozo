import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { downloadHtmlAsPdf } from "@/lib/pdf-generator";
import { toast } from "sonner";
import { extractManagedRespondentName, getManagedScoreSummary } from "@/lib/manager-notifications";
import {
  History, Download, FileText, Calendar, Shield, Loader2, Eye, Building2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface TestHistoryItem {
  id: string;
  test_type: string;
  test_name: string;
  completed_at: string;
  pdf_diagnostic_path: string | null;
  pdf_report_path: string | null;
  pdf_action_plan_path: string | null;
  metadata?: {
    colaborador_name?: string;
    paciente_name?: string;
    scores?: Record<string, unknown> | null;
    submission_id?: string;
    has_report?: boolean;
  } | null;
}

interface MapsoAssessment {
  id: string;
  organization_name: string;
  organization_sector: string | null;
  irp: number;
  irp_classification: string;
  ipp: number;
  ivo: number;
  diagnosis_html: string | null;
  report_html: string | null;
  created_at: string;
}

const testTypeColors: Record<string, string> = {
  disc: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  mbti: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  temperamento: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  eneagrama: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  mapso: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const getRiskBadgeClass = (classification: string) => {
  switch (classification) {
    case "Crítico": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Alto": return "bg-accent/10 text-accent border-accent/20";
    case "Moderado": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default: return "bg-green-500/10 text-green-600 border-green-500/20";
  }
};

/** Convert markdown to basic HTML for display/PDF */
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hulo])/gm, '')
    .replace(/\n/g, '<br>')
    .replace(/<p><\/p>/g, '');
}

export default function GerenciaHistorico() {
  const { user } = useAuth();
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [mapsoAssessments, setMapsoAssessments] = useState<MapsoAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewHtml, setViewHtml] = useState<{ title: string; html: string } | null>(null);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [reportCache, setReportCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [histRes, mapsoRes] = await Promise.all([
        supabase.from("test_history").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }),
        supabase.from("mapso_assessments" as any).select("id, organization_name, organization_sector, irp, irp_classification, ipp, ivo, diagnosis_html, report_html, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (histRes.data) setHistory(histRes.data as TestHistoryItem[]);
      if (mapsoRes.data) setMapsoAssessments(mapsoRes.data as MapsoAssessment[]);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const downloadFromStorage = async (path: string, filename: string) => {
    const { data, error } = await supabase.storage.from("test-pdfs").download(path);
    if (error || !data) {
      toast.error("Erro ao baixar arquivo.");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMapsoPdf = async (html: string, filename: string) => {
    setDownloading(filename);
    try {
      await downloadHtmlAsPdf(html, filename);
      toast.success("PDF baixado!");
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setDownloading(null);
    }
  };

  const fetchReport = async (submissionId: string): Promise<string | null> => {
    if (reportCache[submissionId]) return reportCache[submissionId];
    
    const { data } = await supabase
      .from("generated_reports")
      .select("report_content")
      .eq("submission_id", submissionId)
      .single();
    
    if (data?.report_content) {
      setReportCache(prev => ({ ...prev, [submissionId]: data.report_content! }));
      return data.report_content;
    }
    return null;
  };

  const handleViewReport = async (item: TestHistoryItem) => {
    const submissionId = item.metadata?.submission_id;
    if (!submissionId) {
      toast.error("Relatório não disponível.");
      return;
    }
    
    setLoadingReport(item.id);
    try {
      const report = await fetchReport(submissionId);
      if (report) {
        const respondentName = extractManagedRespondentName(item);
        const html = markdownToHtml(report);
        setViewHtml({
          title: `Relatório ${item.test_type.toUpperCase()} — ${respondentName}`,
          html,
        });
      } else {
        toast.error("Relatório ainda não foi gerado. Tente novamente em alguns instantes.");
      }
    } catch {
      toast.error("Erro ao carregar relatório.");
    } finally {
      setLoadingReport(null);
    }
  };

  const handleDownloadReport = async (item: TestHistoryItem) => {
    const submissionId = item.metadata?.submission_id;
    if (!submissionId) return;
    
    setDownloading(item.id);
    try {
      const report = await fetchReport(submissionId);
      if (report) {
        const respondentName = extractManagedRespondentName(item);
        const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.7;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #7c3aed;">
              <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">Relatório ${item.test_type.toUpperCase()}</h1>
              <p style="color: #666; margin: 8px 0 0;">${respondentName}</p>
              <p style="color: #999; font-size: 12px; margin: 4px 0 0;">${new Date(item.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            ${markdownToHtml(report)}
          </div>
        `;
        const filename = `Relatorio_${item.test_type.toUpperCase()}_${respondentName.replace(/\s+/g, "_")}.pdf`;
        await downloadHtmlAsPdf(html, filename);
        toast.success("PDF baixado!");
      } else {
        toast.error("Relatório não disponível.");
      }
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setDownloading(null);
    }
  };

  const hasMapso = mapsoAssessments.length > 0;
  const hasTests = history.length > 0;
  const hasManagedReport = (item: TestHistoryItem) => !!item.metadata?.submission_id;
  const hasStoragePdfs = (item: TestHistoryItem) => !!(item.pdf_diagnostic_path || item.pdf_report_path || item.pdf_action_plan_path);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <History className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground">Todos os testes e avaliações realizados.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !hasTests && !hasMapso ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum teste no histórico</h3>
            <p className="text-muted-foreground text-sm">
              Quando você completar testes, eles aparecerão aqui com os PDFs para download.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={hasMapso ? "mapso" : "tests"}>
          <TabsList className="mb-4">
            {hasMapso && <TabsTrigger value="mapso">MAPSO / NR1</TabsTrigger>}
            {hasTests && <TabsTrigger value="tests">Testes Individuais</TabsTrigger>}
          </TabsList>

          {/* MAPSO Tab */}
          {hasMapso && (
            <TabsContent value="mapso">
              <div className="space-y-3">
                {mapsoAssessments.map((a) => (
                  <Card key={a.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-primary/10 p-3">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{a.organization_name}</h3>
                              <Badge className={getRiskBadgeClass(a.irp_classification)} variant="outline">
                                IRP: {a.irp} — {a.irp_classification}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(a.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit", month: "long", year: "numeric",
                              })}
                              {a.organization_sector && <span> · {a.organization_sector}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {a.diagnosis_html && (
                            <>
                              <Button variant="outline" size="sm" className="gap-1"
                                onClick={() => setViewHtml({ title: `Diagnóstico — ${a.organization_name}`, html: a.diagnosis_html! })}>
                                <Eye className="h-3 w-3" /> Ver
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1"
                                onClick={() => handleDownloadMapsoPdf(a.diagnosis_html!, `Diagnostico_${a.organization_name.replace(/\s+/g, "_")}.pdf`)}
                                disabled={downloading !== null}>
                                {downloading?.includes("Diagnostico") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                Diagnóstico
                              </Button>
                            </>
                          )}
                          {a.report_html && (
                            <Button variant="outline" size="sm" className="gap-1"
                              onClick={() => handleDownloadMapsoPdf(a.report_html!, `Relatorio_NR1_${a.organization_name.replace(/\s+/g, "_")}.pdf`)}
                              disabled={downloading !== null}>
                              {downloading?.includes("NR1") ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                              NR1
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Regular Tests Tab */}
          {hasTests && (
            <TabsContent value="tests">
              <div className="space-y-3">
                {history.map((item) => {
                  const respondentName = item.metadata?.colaborador_name || item.metadata?.paciente_name;
                  const scoreSummary = getManagedScoreSummary(item.test_type, item.metadata?.scores || null);

                  return (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground">{item.test_name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${testTypeColors[item.test_type] || "bg-muted text-muted-foreground"}`}>
                                  {item.test_type.toUpperCase()}
                                </span>
                              </div>
                              {respondentName && (
                                <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span>{respondentName}</span>
                                  {scoreSummary && (
                                    <span>· {scoreSummary.detail ? `${scoreSummary.label} — ${scoreSummary.detail}` : scoreSummary.label}</span>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(item.completed_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Storage PDFs (from regular test flow) */}
                            {item.pdf_diagnostic_path && (
                              <Button variant="outline" size="sm"
                                onClick={() => downloadFromStorage(item.pdf_diagnostic_path!, `diagnostico-${item.test_type}.pdf`)}>
                                <Download className="w-3.5 h-3.5 mr-1" /> Diagnóstico
                              </Button>
                            )}
                            {item.pdf_report_path && (
                              <Button variant="outline" size="sm"
                                onClick={() => downloadFromStorage(item.pdf_report_path!, `relatorio-${item.test_type}.pdf`)}>
                                <Download className="w-3.5 h-3.5 mr-1" /> Relatório
                              </Button>
                            )}
                            {item.pdf_action_plan_path && (
                              <Button variant="outline" size="sm"
                                onClick={() => downloadFromStorage(item.pdf_action_plan_path!, `plano-acao-${item.test_type}.pdf`)}>
                                <Download className="w-3.5 h-3.5 mr-1" /> Plano de Ação
                              </Button>
                            )}

                            {/* AI-generated reports (from managed test flow) */}
                            {!hasStoragePdfs(item) && hasManagedReport(item) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleViewReport(item)}
                                  disabled={loadingReport === item.id}
                                >
                                  {loadingReport === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                                  Ver Relatório
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleDownloadReport(item)}
                                  disabled={downloading === item.id}
                                >
                                  {downloading === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                  Baixar PDF
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewHtml} onOpenChange={() => setViewHtml(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewHtml?.title}</DialogTitle>
          </DialogHeader>
          {viewHtml && (
            <div className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: viewHtml.html }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
