import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import {
  Users, Plus, Trash2, Send, Copy, Building2, BarChart3,
  FileText, Download, Loader2, CheckCircle2, Clock, AlertTriangle, Shield,
} from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import { downloadHtmlAsPdf } from "@/lib/pdf-generator";
import { generateDiagnosisHtml, generateNR1ReportHtml } from "@/modules/mapso/lib/nr1-report-generator";
import { generateActionPlan } from "@/modules/mapso/lib/action-plan-generator";
import { getRiskClassification } from "@/modules/mapso/data/miarpo-questionnaire";
import type { AssessmentResult, DimensionResult } from "@/modules/mapso/lib/miarpo-engine";

interface Employee {
  id: string;
  name: string;
  cpf: string | null;
  department: string | null;
  position: string | null;
  email: string | null;
}

interface AssessmentLink {
  id: string;
  employee_id: string;
  token: string;
  status: string;
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [links, setLinks] = useState<AssessmentLink[]>([]);
  const [assessments, setAssessments] = useState<MapsoAssessment[]>([]);
  const [newEmp, setNewEmp] = useState({ name: "", cpf: "", department: "", position: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    // Get empresa
    const { data: emp } = await supabase.from("empresas").select("id, razao_social").eq("profile_id", user!.id).single();
    if (!emp) { setLoading(false); return; }
    setEmpresaId(emp.id);
    setEmpresaName(emp.razao_social || "Empresa");

    // Fetch in parallel
    const [empRes, linkRes, assessRes] = await Promise.all([
      supabase.from("mapso_employees" as any).select("*").eq("empresa_id", emp.id).order("created_at", { ascending: false }),
      supabase.from("mapso_assessment_links" as any).select("*").eq("empresa_id", emp.id).order("created_at", { ascending: false }),
      supabase.from("mapso_assessments" as any).select("*").eq("empresa_id", emp.id).order("created_at", { ascending: false }),
    ]);

    setEmployees((empRes.data as any[]) || []);
    setLinks((linkRes.data as any[]) || []);
    setAssessments((assessRes.data as any[]) || []);
    setLoading(false);
  };

  const addEmployee = async () => {
    if (!empresaId || !newEmp.name.trim()) return;
    const { error } = await supabase.from("mapso_employees" as any).insert({
      empresa_id: empresaId,
      name: sanitizeString(newEmp.name, 200),
      cpf: sanitizeString(newEmp.cpf, 14) || null,
      department: sanitizeString(newEmp.department, 100) || null,
      position: sanitizeString(newEmp.position, 100) || null,
      email: sanitizeString(newEmp.email, 255) || null,
    } as any);
    if (error) {
      toast({ title: "Erro ao adicionar funcionário", variant: "destructive" });
    } else {
      setNewEmp({ name: "", cpf: "", department: "", position: "", email: "" });
      fetchData();
    }
  };

  const deleteEmployee = async (id: string) => {
    await supabase.from("mapso_employees" as any).delete().eq("id", id);
    fetchData();
  };

  const sendLink = async (employeeId: string) => {
    if (!empresaId) return;
    const { data, error } = await supabase.from("mapso_assessment_links" as any).insert({
      empresa_id: empresaId,
      employee_id: employeeId,
    } as any).select("token").single();

    if (error) {
      toast({ title: "Erro ao gerar link", variant: "destructive" });
      return;
    }

    const link = `${window.location.origin}/mapso/respond/${(data as any).token}`;
    await navigator.clipboard.writeText(link);
    sonnerToast.success("Link copiado para a área de transferência!", { description: link });
    fetchData();
  };

  const getEmployeeName = (id: string) => employees.find((e) => e.id === id)?.name || "—";
  const getEmployeeDept = (id: string) => employees.find((e) => e.id === id)?.department || "—";

  const getLinkForEmployee = (employeeId: string) => links.find((l) => l.employee_id === employeeId);
  const getAssessmentForEmployee = (employeeId: string) => assessments.find((a) => a.employee_id === employeeId);

  // Stats
  const totalEmployees = employees.length;
  const completedCount = assessments.length;
  const pendingCount = totalEmployees - completedCount;
  const completionRate = totalEmployees > 0 ? (completedCount / totalEmployees) * 100 : 0;
  const allCompleted = totalEmployees > 0 && completedCount === totalEmployees;

  // Sector breakdown
  const sectorStats = useMemo(() => {
    const sectors: Record<string, { total: number; completed: number; totalIrp: number }> = {};
    for (const emp of employees) {
      const dept = emp.department || "Sem setor";
      if (!sectors[dept]) sectors[dept] = { total: 0, completed: 0, totalIrp: 0 };
      sectors[dept].total++;
      const assessment = assessments.find((a) => a.employee_id === emp.id);
      if (assessment) {
        sectors[dept].completed++;
        sectors[dept].totalIrp += assessment.irp;
      }
    }
    return Object.entries(sectors).map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      averageIrp: data.completed > 0 ? Math.round(data.totalIrp / data.completed) : null,
      riskLabel: data.completed > 0 ? getRiskClassification(data.totalIrp / data.completed).label : "—",
    }));
  }, [employees, assessments]);

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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
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
                    <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
                    <p className="text-xs text-muted-foreground">Funcionários</p>
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
                    <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
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

          <Tabs defaultValue="employees">
            <TabsList className="mb-4">
              <TabsTrigger value="employees">Funcionários</TabsTrigger>
              <TabsTrigger value="sectors">Diagnóstico por Setor</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>

            {/* Employees Tab */}
            <TabsContent value="employees">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Cadastrar Funcionário</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    <div className="space-y-1">
                      <Label>Nome *</Label>
                      <Input value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="Nome completo" maxLength={200} />
                    </div>
                    <div className="space-y-1">
                      <Label>CPF</Label>
                      <Input value={newEmp.cpf} onChange={(e) => setNewEmp({ ...newEmp, cpf: e.target.value })} placeholder="000.000.000-00" maxLength={14} />
                    </div>
                    <div className="space-y-1">
                      <Label>Departamento</Label>
                      <Input value={newEmp.department} onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })} placeholder="Ex: Administrativo" maxLength={100} />
                    </div>
                    <div className="space-y-1">
                      <Label>Cargo</Label>
                      <Input value={newEmp.position} onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })} placeholder="Ex: Analista" maxLength={100} />
                    </div>
                    <div className="space-y-1">
                      <Label>E-mail</Label>
                      <Input value={newEmp.email} onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })} placeholder="email@empresa.com" maxLength={255} type="email" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addEmployee} disabled={!newEmp.name.trim()} className="gap-1 w-full">
                        <Plus className="h-4 w-4" /> Adicionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Funcionários ({totalEmployees})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employees.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Nenhum funcionário cadastrado. Adicione funcionários acima.</p>
                  ) : (
                    <div className="space-y-2">
                      {employees.map((emp) => {
                        const link = getLinkForEmployee(emp.id);
                        const assessment = getAssessmentForEmployee(emp.id);
                        return (
                          <div key={emp.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">{emp.name}</span>
                                {emp.department && <Badge variant="secondary" className="text-xs">{emp.department}</Badge>}
                                {emp.position && <span className="text-xs text-muted-foreground">· {emp.position}</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {emp.cpf && <span>CPF: {emp.cpf}</span>}
                                {emp.email && <span>{emp.email}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {assessment ? (
                                <Badge className="bg-primary/10 text-primary border-primary/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> IRP: {assessment.irp} — {assessment.irp_classification}
                                </Badge>
                              ) : link ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" /> Link enviado
                                </Badge>
                              ) : null}
                              {!assessment && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => sendLink(emp.id)}
                                  className="gap-1"
                                >
                                  {link ? <Copy className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                                  {link ? "Copiar" : "Enviar"}
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => deleteEmployee(emp.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
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
                    <p className="text-muted-foreground text-sm text-center py-8">Cadastre funcionários com departamento para ver o diagnóstico por setor.</p>
                  ) : (
                    <div className="space-y-3">
                      {sectorStats.map((sector) => (
                        <div key={sector.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                          <div>
                            <div className="font-medium text-foreground">{sector.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {sector.completed}/{sector.total} responderam
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Progress value={(sector.completed / sector.total) * 100} className="h-2 w-24" />
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
                        Nenhuma avaliação finalizada ainda. Os relatórios serão gerados automaticamente quando
                        os funcionários completarem o teste.
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
      </section>
      <Footer />
    </div>
  );
}
