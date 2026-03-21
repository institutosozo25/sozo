import { useState } from "react";
import { useMbti } from "../contexts/MbtiContext";
import { DIMENSION_LABELS } from "../data/mbti-questionnaire";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { escapeHtml } from "@/lib/validation";
import { sanitizeAndFormatReport } from "@/lib/pdf-generator";
import { downloadTestReportPdf, fetchEmpresaBranding } from "@/lib/searchable-pdf";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MbtiFullReport = () => {
  const { result, fullReport, resetTest, respondentName } = useMbti();
  const { user, plan } = useAuth();
  const [downloading, setDownloading] = useState(false);

  if (!result || !fullReport) return null;

  const { type, typeName, percentages } = result;

  const dimensionPairs = [
    { left: "E", right: "I" },
    { left: "S", right: "N" },
    { left: "T", right: "F" },
    { left: "J", right: "P" },
  ];

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      let branding = {};
      if (user && plan === "enterprise") {
        branding = await fetchEmpresaBranding(user.id);
      }

      const scores = dimensionPairs.map((dim) => {
        const leftPct = percentages[dim.left];
        const rightPct = percentages[dim.right];
        const winner = leftPct >= rightPct ? dim.left : dim.right;
        const winnerPct = Math.max(leftPct, rightPct);
        return {
          label: `${DIMENSION_LABELS[winner]} (${winnerPct}%)`,
          value: winner,
          color: "#533483",
        };
      });

      await downloadTestReportPdf({
        title: "RELAT\u00D3RIO DE PERSONALIDADE MBTI",
        subtitle: `${type} \u2014 ${typeName}`,
        respondentName,
        scores,
        content: fullReport,
        ...branding,
      }, `Relatorio_MBTI_${type}_${respondentName.replace(/\s+/g, "_")}.pdf`);
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
            <p className="text-primary-foreground/70 text-sm mb-2">Relatório de Personalidade MBTI</p>
            <h1 className="font-heading text-4xl font-bold text-primary-foreground mb-1">
              {type} — {typeName}
            </h1>
            <p className="text-primary-foreground/80">{escapeHtml(respondentName)}</p>
          </div>

          <div className="p-6 border-b border-border">
            <div className="grid grid-cols-4 gap-4">
              {dimensionPairs.map((dim) => {
                const leftPct = percentages[dim.left];
                const rightPct = percentages[dim.right];
                const winner = leftPct >= rightPct ? dim.left : dim.right;
                const winnerPct = Math.max(leftPct, rightPct);
                return (
                  <div key={dim.left + dim.right} className="text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-lg">
                      {winner}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {DIMENSION_LABELS[winner]} ({winnerPct}%)
                    </p>
                  </div>
                );
              })}
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

export default MbtiFullReport;
