import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download, Eye, Building2, AlertTriangle, Shield, Loader2, ExternalLink, Upload,
  Users, CheckCircle2, Clock, BarChart3,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { downloadHtmlAsPdf } from "@/lib/pdf-generator";

interface MapsoAssessment {
  id: string;
  organization_name: string;
  organization_sector: string;
  empresa_id: string | null;
  employee_id: string | null;
  irp: number;
  irp_classification: string;
  ipp: number;
  ivo: number;
  dimension_scores: any;
  diagnosis_html: string | null;
  report_html: string | null;
  action_plan: any;
  drive_diagnosis_file_id: string | null;
  drive_report_file_id: string | null;
  created_at: string;
}

interface CompanyTracking {
  empresa_id: string;
  company_name: string;
  total_employees: number;
  completed: number;
  completion_rate: number;
  avg_irp: number | null;
}

const getRiskBadgeClass = (classification: string) => {
  switch (classification) {
    case "Crítico": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Alto": return "bg-accent/10 text-accent border-accent/20";
    case "Moderado": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default: return "bg-green-500/10 text-green-600 border-green-500/20";
  }
};

export default function AdminMapso() {
  const [assessments, setAssessments] = useState<MapsoAssessment[]>([]);
  const [companyTracking, setCompanyTracking] = useState<CompanyTracking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewHtml, setViewHtml] = useState<{ title: string; html: string } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [assessRes, empresasRes, employeesRes] = await Promise.all([
      supabase.from("mapso_assessments" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("empresas").select("id, razao_social, nome_fantasia"),
      supabase.from("mapso_employees" as any).select("id, empresa_id, status"),
    ]);

    const allAssessments = (assessRes.data as any[]) || [];
    const allEmpresas = (empresasRes.data as any[]) || [];
    const allEmployees = (employeesRes.data as any[]) || [];

    setAssessments(allAssessments);

    // Build company tracking
    const tracking: CompanyTracking[] = [];
    for (const emp of allEmpresas) {
      const empEmployees = allEmployees.filter((e: any) => e.empresa_id === emp.id);
      if (empEmployees.length === 0) continue;

      const empAssessments = allAssessments.filter((a: any) => a.empresa_id === emp.id);
      const completed = empAssessments.length;
      const total = empEmployees.length;
      const avgIrp = completed > 0
        ? Math.round(empAssessments.reduce((s: number, a: any) => s + a.irp, 0) / completed * 10) / 10
        : null;

      tracking.push({
        empresa_id: emp.id,
        company_name: emp.nome_fantasia || emp.razao_social || "Sem nome",
        total_employees: total,
        completed,
        completion_rate: Math.round((completed / total) * 100),
        avg_irp: avgIrp,
      });
    }

    setCompanyTracking(tracking.sort((a, b) => b.total_employees - a.total_employees));
    setIsLoading(false);
  };

  const downloadPdf = async (html: string, filename: string) => {
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

  const uploadToDrive = async (assessmentId: string, docType: "diagnosis" | "report" | "action_plan") => {
    const key = `${assessmentId}-${docType}`;
    setUploading(key);
    try {
      const { data, error } = await supabase.functions.invoke("upload-mapso-to-drive", {
        body: { assessmentId, docType },
      });
      if (error) throw error;
      if (data?.driveUrl) {
        toast.success("Enviado ao Google Drive!", {
          action: { label: "Abrir", onClick: () => window.open(data.driveUrl, "_blank") },
        });
        fetchAll();
      }
    } catch (e) {
      console.error("Drive upload error:", e);
      toast.error("Erro ao enviar para o Google Drive.");
    } finally {
      setUploading(null);
    }
  };

  const openDriveFile = (fileId: string) => {
    window.open(`https://drive.google.com/file/d/${fileId}/view`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Global stats
  const totalCompanies = companyTracking.length;
  const totalEmployees = companyTracking.reduce((s, c) => s + c.total_employees, 0);
  const totalCompleted = companyTracking.reduce((s, c) => s + c.completed, 0);
  const globalRate = totalEmployees > 0 ? Math.round((totalCompleted / totalEmployees) * 100) : 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Avaliações Psicossociais</h1>
          <p className="text-muted-foreground">MAPSO — Diagnósticos e Relatórios NR1</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          {assessments.length} avaliações
        </Badge>
      </div>

      {/* Global KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCompanies}</p>
                <p className="text-xs text-muted-foreground">Empresas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 p-2 text-secondary"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Total Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2 text-accent"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Respostas Recebidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><BarChart3 className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{globalRate}%</p>
                <p className="text-xs text-muted-foreground">Conclusão Global</p>
              </div>
            </div>
            <Progress value={globalRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tracking">
        <TabsList className="mb-4">
          <TabsTrigger value="tracking">Acompanhamento</TabsTrigger>
          <TabsTrigger value="assessments">Avaliações Individuais</TabsTrigger>
        </TabsList>

        {/* Company Tracking Tab */}
        <TabsContent value="tracking">
          {companyTracking.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma empresa com colaboradores MAPSO cadastrados.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {companyTracking.map((c) => {
                const isComplete = c.completion_rate === 100;
                return (
                  <Card key={c.empresa_id}>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{c.company_name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{c.total_employees} colaboradores</span>
                            <span>·</span>
                            <span>{c.completed} responderam</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Progresso</span>
                              <span>{c.completion_rate}%</span>
                            </div>
                            <Progress value={c.completion_rate} className="h-2" />
                          </div>

                          {isComplete ? (
                            c.avg_irp !== null ? (
                              <Badge variant="outline" className={
                                c.avg_irp > 60 ? "border-destructive text-destructive" :
                                c.avg_irp > 40 ? "border-accent text-accent" :
                                "border-primary text-primary"
                              }>
                                IRP Médio: {c.avg_irp}
                              </Badge>
                            ) : null
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground gap-1">
                              <Clock className="h-3 w-3" /> Em andamento
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Individual Assessments Tab */}
        <TabsContent value="assessments">
          {assessments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma avaliação MAPSO realizada ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assessments.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{a.organization_name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {a.organization_sector} · {new Date(a.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{a.irp}</div>
                          <div className="text-xs text-muted-foreground">IRP</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">{a.ivo}/8</div>
                          <div className="text-xs text-muted-foreground">IVO</div>
                        </div>
                        <Badge className={getRiskBadgeClass(a.irp_classification)} variant="outline">
                          {a.irp_classification === "Alto" || a.irp_classification === "Crítico" ? (
                            <AlertTriangle className="mr-1 h-3 w-3" />
                          ) : null}
                          {a.irp_classification}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                      {a.diagnosis_html && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => setViewHtml({ title: `Diagnóstico — ${a.organization_name}`, html: a.diagnosis_html! })}>
                            <Eye className="h-3 w-3" /> Diagnóstico
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => downloadPdf(a.diagnosis_html!, `Diagnostico_${a.organization_name.replace(/\s+/g, "_")}.pdf`)}
                            disabled={downloading !== null}>
                            <Download className="h-3 w-3" /> PDF
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => a.drive_diagnosis_file_id ? openDriveFile(a.drive_diagnosis_file_id) : uploadToDrive(a.id, "diagnosis")}
                            disabled={uploading !== null}>
                            {uploading === `${a.id}-diagnosis`
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : a.drive_diagnosis_file_id
                              ? <ExternalLink className="h-3 w-3" />
                              : <Upload className="h-3 w-3" />}
                            {a.drive_diagnosis_file_id ? "Drive" : "Enviar Drive"}
                          </Button>
                        </>
                      )}

                      {a.report_html && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => setViewHtml({ title: `Relatório NR1 — ${a.organization_name}`, html: a.report_html! })}>
                            <Eye className="h-3 w-3" /> NR1
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => downloadPdf(a.report_html!, `Relatorio_NR1_${a.organization_name.replace(/\s+/g, "_")}.pdf`)}
                            disabled={downloading !== null}>
                            <Download className="h-3 w-3" /> PDF
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1"
                            onClick={() => a.drive_report_file_id ? openDriveFile(a.drive_report_file_id) : uploadToDrive(a.id, "report")}
                            disabled={uploading !== null}>
                            {uploading === `${a.id}-report`
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : a.drive_report_file_id
                              ? <ExternalLink className="h-3 w-3" />
                              : <Upload className="h-3 w-3" />}
                            {a.drive_report_file_id ? "Drive" : "Enviar Drive"}
                          </Button>
                        </>
                      )}

                      {a.action_plan && Array.isArray(a.action_plan) && a.action_plan.length > 0 && (
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => uploadToDrive(a.id, "action_plan")}
                          disabled={uploading !== null}>
                          {uploading === `${a.id}-action_plan`
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Upload className="h-3 w-3" />}
                          Plano → Drive
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewHtml} onOpenChange={() => setViewHtml(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewHtml?.title}</DialogTitle>
          </DialogHeader>
          {viewHtml && (
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: viewHtml.html }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
