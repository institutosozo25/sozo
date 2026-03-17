import { useState } from "react";
import { useEneagrama } from "../contexts/EneagramaContext";
import { ENEAGRAMA_TYPE_NAMES, ENEAGRAMA_COLORS, type EneagramaType } from "../data/eneagrama-questionnaire";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { escapeHtml } from "@/lib/validation";
import { downloadHtmlAsPdf, sanitizeAndFormatReport } from "@/lib/pdf-generator";
import { toast } from "sonner";

const EneagramaFullReport = () => {
  const { result, fullReport, resetTest, respondentName } = useEneagrama();
  const [downloading, setDownloading] = useState(false);

  if (!result || !fullReport) return null;

  const { dominant, dominantName, wing, wingName, percentages } = result;
  const allTypes = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as EneagramaType[]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const reportHtml = sanitizeAndFormatReport(fullReport);
      const html = `
<div style="max-width:750px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;line-height:1.7;">
  <div style="text-align:center;padding:30px 20px;background:linear-gradient(135deg,#0f3460,#533483);color:white;border-radius:12px;margin-bottom:30px;">
    <h1 style="margin:0 0 8px;font-size:24px;">RELATÓRIO DO ENEAGRAMA</h1>
    <p style="margin:0;font-size:18px;">Tipo ${dominant} — ${escapeHtml(dominantName)}</p>
    <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">Asa: Tipo ${wing} — ${escapeHtml(wingName)}</p>
    <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">${escapeHtml(respondentName)} · ${new Date().toLocaleDateString("pt-BR")}</p>
  </div>
  <table style="width:100%;margin:0 auto 24px;border-collapse:collapse;">
    <tr>
      ${allTypes.map(t => `
      <td style="text-align:center;padding:4px;">
        <div style="width:40px;height:40px;border-radius:50%;background:${ENEAGRAMA_COLORS[t]};color:white;line-height:40px;font-weight:700;font-size:12px;margin:0 auto 4px;text-align:center;">${percentages[t]}%</div>
        <div style="font-size:9px;color:#666;">${ENEAGRAMA_TYPE_NAMES[t]}</div>
      </td>`).join("")}
    </tr>
  </table>
  <div style="padding:0 10px;">${reportHtml}</div>
  <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #e0e0e0;color:#888;font-size:12px;">
    <p>© Instituto Plenitude SOZO — Relatório gerado automaticamente</p>
  </div>
</div>`;
      await downloadHtmlAsPdf(html, `Relatorio_Eneagrama_Tipo${dominant}_${escapeHtml(respondentName).replace(/\s+/g, "_")}.pdf`);
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
            <p className="text-primary-foreground/70 text-sm mb-2">Relatório do Eneagrama</p>
            <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-2">
              Tipo {dominant} — {dominantName}
            </h1>
            <p className="text-primary-foreground/80 text-sm mb-1">
              Asa: Tipo {wing} — {wingName}
            </p>
            <p className="text-primary-foreground/80">{escapeHtml(respondentName)}</p>
          </div>

          <div className="p-6 border-b border-border">
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-3">
              {allTypes.map((t) => (
                <div key={t} className="text-center">
                  <div
                    className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-xs"
                    style={{ backgroundColor: ENEAGRAMA_COLORS[t] }}
                  >
                    {percentages[t]}%
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground leading-tight">{ENEAGRAMA_TYPE_NAMES[t]}</p>
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

export default EneagramaFullReport;
