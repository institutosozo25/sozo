import { useTemperamento } from "../contexts/TemperamentoContext";
import { TEMPERAMENTO_LABELS, TEMPERAMENTO_COLORS, type TemperamentoType } from "../data/temperamento-questionnaire";
import { Button } from "@/components/ui/button";
import { RefreshCw, Printer } from "lucide-react";
import { escapeHtml } from "@/lib/validation";

const TemperamentoFullReport = () => {
  const { result, fullReport, resetTest, respondentName } = useTemperamento();

  if (!result || !fullReport) return null;

  const { primaryLabel, secondaryLabel, percentages } = result;
  const temperamentos: TemperamentoType[] = ["sanguineo", "colerico", "melancolico", "fleumatico"];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl animate-fade-up">
        {/* Report Header */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8 print:shadow-none">
          <div className="gradient-primary p-8 text-center">
            <p className="text-primary-foreground/70 text-sm mb-2">Relatório de Perfil Temperamental</p>
            <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-2">
              Temperamento {primaryLabel} e {secondaryLabel}
            </h1>
            <p className="text-primary-foreground/80">
              {escapeHtml(respondentName)}
            </p>
          </div>

          {/* Score Summary */}
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

        {/* Report Content */}
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

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center print:hidden">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir
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

export default TemperamentoFullReport;
