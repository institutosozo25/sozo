import { useState } from "react";
import { useTemperamento } from "../contexts/TemperamentoContext";
import { TEMPERAMENTO_LABELS, TEMPERAMENTO_COLORS, type TemperamentoType } from "../data/temperamento-questionnaire";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { escapeHtml } from "@/lib/validation";
import { sanitizeAndFormatReport } from "@/lib/pdf-generator";
import { downloadTestReportPdf, fetchEmpresaBranding } from "@/lib/searchable-pdf";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TemperamentoFullReport = () => {
  const { result, fullReport, resetTest, respondentName } = useTemperamento();
  const { user, plan } = useAuth();
  const [downloading, setDownloading] = useState(false);

  if (!result || !fullReport) return null;

  const { primaryLabel, secondaryLabel, percentages } = result;
  const temperamentos: TemperamentoType[] = ["sanguineo", "colerico", "melancolico", "fleumatico"];

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      let branding = {};
      if (user && plan === "enterprise") {
        branding = await fetchEmpresaBranding(user.id);
      }

      await downloadTestReportPdf({
        title: "RELAT\u00D3RIO DE PERFIL TEMPERAMENTAL",
        subtitle: `Temperamento ${primaryLabel} e ${secondaryLabel}`,
        respondentName,
        scores: temperamentos.map((t) => ({
          label: TEMPERAMENTO_LABELS[t],
          value: `${percentages[t]}%`,
          color: TEMPERAMENTO_COLORS[t],
        })),
        content: fullReport,
        ...branding,
      }, `Relatorio_Temperamento_${respondentName.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF baixado com sucesso!");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl animate-fade-up">
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8 print:shadow-none">
          <div className="gradient-primary p-8 text-center">
            <p className="text-primary-foreground/70 text-sm mb-2">Relatório de Perfil Temperamental</p>
            <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-2">
              Temperamento {primaryLabel} e {secondaryLabel}
            </h1>
            <p className="text-primary-foreground/80">{escapeHtml(respondentName)}</p>
          </div>

          <div className="p-6 border-b border-border">
            <div className="grid grid-cols-4 gap-4">
              {temperamentos.map((t) => (
                <div key={t} className="text-center">
                  <div
                    className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-white font-bold text-lg"
                    style={{ backgroundColor: TEMPERAMENTO_COLORS[t] }}
                  >
                    {percentages[t]}%
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{TEMPERAMENTO_LABELS[t]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 mb-8 print:shadow-none">
          <div
            className="prose prose-sm sm:prose max-w-none
              prose-headings:font-heading prose-headings:text-foreground
              prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-8 prose-h1:border-b prose-h1:border-border prose-h1:pb-3
              prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-6
              prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-2
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-ul:space-y-1
            "
            dangerouslySetInnerHTML={{ __html: sanitizeAndFormatReport(fullReport) }}
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading} className="gap-2">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar PDF
          </Button>
          <Button variant="outline" onClick={resetTest} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Fazer Novamente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemperamentoFullReport;
