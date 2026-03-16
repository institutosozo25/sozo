import { useState } from "react";
import { useMbti } from "../contexts/MbtiContext";
import { DIMENSION_LABELS } from "../data/mbti-questionnaire";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { escapeHtml } from "@/lib/validation";
import { downloadHtmlAsPdf } from "@/lib/pdf-generator";
import { toast } from "sonner";

const MbtiFullReport = () => {
  const { result, fullReport, resetTest, respondentName } = useMbti();
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
      const html = `
<div style="max-width:800px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;line-height:1.7;">
  <div style="text-align:center;padding:30px;background:linear-gradient(135deg,#0f3460,#533483);color:white;border-radius:12px;margin-bottom:30px;">
    <h1 style="margin:0 0 8px;font-size:24px;">RELATÓRIO DE PERSONALIDADE MBTI</h1>
    <p style="margin:0;font-size:22px;font-weight:700;">${type} — ${typeName}</p>
    <p style="margin:4px 0 0;opacity:0.8;font-size:14px;">${escapeHtml(respondentName)} · ${new Date().toLocaleDateString("pt-BR")}</p>
  </div>
  <div style="padding:0 20px;">${sanitizeAndFormatReport(fullReport)}</div>
  <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #e0e0e0;color:#888;font-size:12px;">
    <p>© Instituto Plenitude SOZO — Relatório gerado automaticamente</p>
  </div>
</div>`;
      await downloadHtmlAsPdf(html, `Relatorio_MBTI_${type}_${escapeHtml(respondentName).replace(/\s+/g, "_")}.pdf`);
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

function sanitizeAndFormatReport(markdown: string): string {
  let clean = markdown
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<link[\s\S]*?>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");

  let html = clean
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[•\-] (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/<\/li>\n<li>/g, '</li><li>');

  html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

  if (!html.startsWith('<')) html = `<p>${html}`;
  if (!html.endsWith('>')) html = `${html}</p>`;

  return html;
}

export default MbtiFullReport;
