import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Building2, AlertTriangle, Shield, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface MapsoAssessment {
  id: string;
  organization_name: string;
  organization_sector: string;
  irp: number;
  irp_classification: string;
  ipp: number;
  ivo: number;
  dimension_scores: any;
  diagnosis_html: string | null;
  report_html: string | null;
  action_plan: any;
  created_at: string;
}

const getRiskBadgeClass = (classification: string) => {
  switch (classification) {
    case "Crítico":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "Alto":
      return "bg-accent/10 text-accent border-accent/20";
    case "Moderado":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default:
      return "bg-green-500/10 text-green-600 border-green-500/20";
  }
};

export default function AdminMapso() {
  const [assessments, setAssessments] = useState<MapsoAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewHtml, setViewHtml] = useState<{ title: string; html: string } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    const { data, error } = await supabase
      .from("mapso_assessments" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAssessments(data as any);
    }
    setIsLoading(false);
  };

  const downloadPdf = async (html: string, filename: string) => {
    setDownloading(filename);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(container)
        .save();

      document.body.removeChild(container);
      toast.success("PDF baixado!");
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <CardContent className="flex flex-wrap items-center gap-4 p-6">
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

                <div className="flex gap-2">
                  {a.diagnosis_html && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setViewHtml({ title: `Diagnóstico — ${a.organization_name}`, html: a.diagnosis_html! })}
                      >
                        <Eye className="h-3 w-3" /> Diagnóstico
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => downloadPdf(a.diagnosis_html!, `Diagnostico_${a.organization_name.replace(/\s+/g, "_")}.pdf`)}
                        disabled={downloading !== null}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {a.report_html && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setViewHtml({ title: `Relatório NR1 — ${a.organization_name}`, html: a.report_html! })}
                      >
                        <Eye className="h-3 w-3" /> NR1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => downloadPdf(a.report_html!, `Relatorio_NR1_${a.organization_name.replace(/\s+/g, "_")}.pdf`)}
                        disabled={downloading !== null}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
