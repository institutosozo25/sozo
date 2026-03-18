import { useTemperamento } from "../contexts/TemperamentoContext";
import { TEMPERAMENTO_LABELS, TEMPERAMENTO_COLORS, type TemperamentoType } from "../data/temperamento-questionnaire";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Check, BarChart3, Sparkles, LogIn, Crown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTestAccess } from "@/hooks/useTestAccess";
import { toast } from "sonner";
import { saveTestSubmission, saveGeneratedReport } from "@/lib/test-persistence";
import { Link } from "react-router-dom";

const TEMPERAMENTO_DESCRIPTIONS: Record<TemperamentoType, string> = {
  colerico: "O temperamento Colérico é caracterizado por assertividade, liderança natural, energia e determinação. Pessoas coléricas tendem a assumir papéis de liderança, gostam de estar no comando e tomam decisões rápidas. São altamente motivadas e orientadas para resultados.",
  sanguineo: "O temperamento Sanguíneo é caracterizado por sociabilidade, entusiasmo, otimismo e expressividade. Pessoas sanguíneas são comunicativas, criativas e adoram estar rodeadas de pessoas. Trazem energia e alegria aos ambientes onde estão.",
  melancolico: "O temperamento Melancólico é caracterizado por profundidade, análise, perfeccionismo e sensibilidade. Pessoas melancólicas são detalhistas, organizadas e valorizam qualidade. São pensadores profundos com grande capacidade de planejamento.",
  fleumatico: "O temperamento Fleumático é caracterizado por calma, estabilidade, diplomacia e paciência. Pessoas fleumáticas são pacificadoras naturais, confiáveis e consistentes. Valorizam harmonia e trabalham bem em equipe.",
};

const TemperamentoPartialResult = () => {
  const { result, setStep, setFullReport, respondentName, respondentEmail } = useTemperamento();
  const { user } = useAuth();
  const { isFree, isLoading: accessLoading } = useTestAccess("temperamento");
  const [loading, setLoading] = useState(false);

  if (!result) return null;

  const { primary, secondary, primaryLabel, secondaryLabel, scores, percentages } = result;
  const temperamentos: TemperamentoType[] = ["sanguineo", "colerico", "melancolico", "fleumatico"];

  const handleUnlock = async () => {
    if (!user) {
      toast.error("Faça login para gerar seu relatório completo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-temperamento-report", {
        body: {
          scores,
          percentages,
          primary,
          secondary,
          primaryLabel,
          secondaryLabel,
          respondentName,
        },
      });

      if (error) throw error;

      const report = data.report;
      setFullReport(report);

      // Persist submission and report
      const submissionId = await saveTestSubmission({
        testSlug: "temperamento",
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
            {respondentName}, confira seu perfil temperamental
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="gradient-primary p-6 text-center">
            <h2 className="text-primary-foreground font-heading text-2xl font-bold mb-1">
              Temperamento {primaryLabel}
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              com traços de {secondaryLabel}
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-3 mb-6">
              {temperamentos.map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium text-foreground">
                    {TEMPERAMENTO_LABELS[t]}
                  </span>
                  <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(percentages[t], 5)}%`,
                        backgroundColor: TEMPERAMENTO_COLORS[t],
                      }}
                    />
                  </div>
                  <span className="w-10 text-sm font-bold text-foreground text-right">
                    {percentages[t]}%
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <h3 className="font-heading font-semibold text-foreground mb-2">
                Seu Temperamento Predominante: {primaryLabel}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TEMPERAMENTO_DESCRIPTIONS[primary]}
              </p>
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

        {/* Free access banner for subscribers */}
        {user && isFree && (
          <div className="bg-card border-2 border-green-500/30 rounded-2xl p-6 mb-8 text-center">
            <Crown className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">
              Relatório incluso no seu plano!
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Como assinante, você tem acesso gratuito ao relatório completo.
            </p>
            <Button
              variant="accent"
              size="xl"
              className="w-full max-w-sm"
              onClick={handleUnlock}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-foreground border-t-transparent mr-2" />
                  Gerando relatório...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Gerar Meu Relatório Completo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Paywall for non-subscribers */}
        {user && !isFree && !accessLoading && (
        <div className="bg-card border-2 border-accent/30 rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <Lock className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">
              Seu relatório completo está pronto
            </h3>
            <p className="text-muted-foreground text-sm">
              Desbloqueie agora para uma análise temperamental profunda e personalizada
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              "Interpretação completa do perfil",
              "Traços psicológicos principais",
              "Padrões emocionais detalhados",
              "Pontos fortes naturais",
              "Desafios comportamentais",
              "Perfil em relacionamentos",
              "Perfil profissional",
              "Plano de evolução pessoal",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>

          <div className="relative mb-6 rounded-xl overflow-hidden">
            <div className="p-4 bg-muted/30 blur-sm select-none pointer-events-none">
              <h4 className="font-bold text-foreground mb-2">Interpretação do Perfil {primaryLabel}</h4>
              <p className="text-sm text-muted-foreground">
                A combinação dos temperamentos {primaryLabel} e {secondaryLabel} cria um indivíduo com características únicas...
                Este perfil se destaca pela capacidade de equilibrar diferentes aspectos comportamentais...
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
        )}
      </div>
    </div>
  );
};

export default TemperamentoPartialResult;