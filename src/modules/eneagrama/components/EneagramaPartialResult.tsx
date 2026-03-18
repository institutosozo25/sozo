import { useEneagrama } from "../contexts/EneagramaContext";
import { ENEAGRAMA_TYPE_NAMES, ENEAGRAMA_COLORS, type EneagramaType } from "../data/eneagrama-questionnaire";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Check, BarChart3, Sparkles, LogIn, Crown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTestAccess } from "@/hooks/useTestAccess";
import { toast } from "sonner";
import { saveTestSubmission, saveGeneratedReport } from "@/lib/test-persistence";
import { Link } from "react-router-dom";

const EneagramaPartialResult = () => {
  const { result, setStep, setFullReport, respondentName, respondentEmail } = useEneagrama();
  const { user } = useAuth();
  const { isFree, isLoading: accessLoading } = useTestAccess("eneagrama");
  const [loading, setLoading] = useState(false);

  if (!result) return null;

  const { dominant, dominantName, wing, wingName, scores, percentages, top3 } = result;
  const allTypes = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as EneagramaType[]);

  const handleUnlock = async () => {
    if (!user) {
      toast.error("Faça login para gerar seu relatório completo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-eneagrama-report", {
        body: {
          scores,
          percentages,
          dominant,
          dominantName,
          wing,
          wingName,
          top3,
          respondentName,
        },
      });

      if (error) throw error;

      const report = data.report;
      setFullReport(report);

      // Persist submission and report
      const submissionId = await saveTestSubmission({
        testSlug: "eneagrama",
        respondentName,
        respondentEmail,
        scores: { ...scores },
      });

      if (submissionId) {
        await saveGeneratedReport({
          submissionId,
          reportContent: report,
          scores: { ...scores },
        });
      }

      setStep("full-report");
      toast.success("Relatório gerado e salvo com sucesso!");
    } catch (err) {
      console.error("Error generating report:", err);
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl animate-fade-up">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Teste Concluído!
          </h1>
          <p className="text-muted-foreground text-lg">
            {respondentName}, confira seu perfil do Eneagrama
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="gradient-primary p-6 text-center">
            <h2 className="text-primary-foreground font-heading text-2xl font-bold mb-1">
              Tipo {dominant} — {dominantName}
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              Asa: Tipo {wing} — {wingName}
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-2 mb-6">
              {allTypes.map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-32 text-xs font-medium text-foreground truncate">
                    {t}. {ENEAGRAMA_TYPE_NAMES[t]}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(percentages[t], 3)}%`,
                        backgroundColor: ENEAGRAMA_COLORS[t],
                      }}
                    />
                  </div>
                  <span className="w-10 text-xs font-bold text-foreground text-right">
                    {percentages[t]}%
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <h3 className="font-heading font-semibold text-foreground mb-2">
                Seus 3 Tipos Predominantes
              </h3>
              <div className="space-y-2">
                {top3.map((t, i) => (
                  <div key={t.type} className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-foreground">{i + 1}º</span>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ENEAGRAMA_COLORS[t.type] }}
                    />
                    <span className="text-foreground">
                      Tipo {t.type} — {t.name} ({t.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auth check */}
        {!user && (
          <div className="bg-card border border-accent/30 rounded-2xl p-6 mb-6 text-center">
            <LogIn className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-foreground font-semibold mb-2">Faça login para gerar seu relatório</p>
            <p className="text-muted-foreground text-sm mb-4">
              Você precisa estar autenticado para gerar e salvar seu relatório completo.
            </p>
            <Button asChild variant="accent">
              <Link to="/auth">Entrar ou Criar Conta</Link>
            </Button>
          </div>
        )}

        {/* Paywall */}
        <div className="bg-card border-2 border-accent/30 rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <Lock className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">
              Seu relatório completo está pronto
            </h3>
            <p className="text-muted-foreground text-sm">
              Desbloqueie agora para uma análise profunda e personalizada do seu perfil
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              "Descrição completa da personalidade",
              "Motivações e medos profundos",
              "Pontos fortes naturais",
              "Desafios emocionais",
              "Influência da asa",
              "Padrões de comportamento",
              "Perfil em relacionamentos",
              "Caminho de desenvolvimento pessoal",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>

          <div className="relative mb-6 rounded-xl overflow-hidden">
            <div className="p-4 bg-muted/30 blur-sm select-none pointer-events-none">
              <h4 className="font-bold text-foreground mb-2">Tipo {dominant} — {dominantName}</h4>
              <p className="text-sm text-muted-foreground">
                O Tipo {dominant} do Eneagrama é caracterizado por padrões únicos de comportamento e motivação...
                Sua personalidade revela uma combinação fascinante de forças e desafios que moldam sua forma de ver o mundo...
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background flex items-end justify-center pb-4">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Button
            variant="accent"
            size="xl"
            className="w-full"
            onClick={handleUnlock}
            disabled={loading || !user}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-foreground border-t-transparent mr-2" />
                Gerando relatório...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5 mr-2" />
                Ver Meu Relatório Completo
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EneagramaPartialResult;