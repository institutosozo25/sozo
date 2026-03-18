import { useMbti } from "../contexts/MbtiContext";
import { DIMENSION_LABELS, MBTI_TYPE_DESCRIPTIONS } from "../data/mbti-questionnaire";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Check, BarChart3, Sparkles, LogIn, Crown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTestAccess } from "@/hooks/useTestAccess";
import { toast } from "sonner";
import { saveTestSubmission, saveGeneratedReport } from "@/lib/test-persistence";
import { Link } from "react-router-dom";

const MbtiPartialResult = () => {
  const { result, setStep, setFullReport, respondentName, respondentEmail } = useMbti();
  const { user } = useAuth();
  const { isFree, isLoading: accessLoading } = useTestAccess("mbti");
  const [loading, setLoading] = useState(false);

  if (!result) return null;

  const { type, typeName, dimensions, percentages } = result;
  const description = MBTI_TYPE_DESCRIPTIONS[type] || "";

  const dimensionPairs: Array<{ key: string; left: string; right: string; leftPole: string; rightPole: string }> = [
    { key: "EI", left: "E", right: "I", leftPole: DIMENSION_LABELS.E, rightPole: DIMENSION_LABELS.I },
    { key: "SN", left: "S", right: "N", leftPole: DIMENSION_LABELS.S, rightPole: DIMENSION_LABELS.N },
    { key: "TF", left: "T", right: "F", leftPole: DIMENSION_LABELS.T, rightPole: DIMENSION_LABELS.F },
    { key: "JP", left: "J", right: "P", leftPole: DIMENSION_LABELS.J, rightPole: DIMENSION_LABELS.P },
  ];

  const handleUnlock = async () => {
    if (!user) {
      toast.error("Faça login para gerar seu relatório completo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mbti-report", {
        body: {
          scores: result.scores,
          type,
          typeName,
          dimensions: result.dimensions,
          percentages,
          respondentName,
        },
      });

      if (error) throw error;

      const report = data.report;
      setFullReport(report);

      // Persist submission and report
      const submissionId = await saveTestSubmission({
        testSlug: "mbti",
        respondentName,
        respondentEmail,
        scores: { ...result.scores },
      });

      if (submissionId) {
        await saveGeneratedReport({
          submissionId,
          reportContent: report,
          scores: { ...result.scores },
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
            {respondentName}, confira seu tipo de personalidade
          </p>
        </div>

        {/* Type Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="gradient-primary p-8 text-center">
            <p className="text-primary-foreground/70 text-sm mb-2">Seu Tipo de Personalidade</p>
            <h2 className="text-primary-foreground font-heading text-4xl font-bold mb-1">
              {type}
            </h2>
            <p className="text-primary-foreground/90 text-xl font-medium">
              {typeName}
            </p>
          </div>

          <div className="p-6">
            {/* Dimension bars */}
            <div className="space-y-4 mb-6">
              {dimensionPairs.map((dim) => {
                const leftPct = percentages[dim.left];
                const rightPct = percentages[dim.right];
                const leftWins = leftPct >= rightPct;
                return (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={`font-medium ${leftWins ? "text-foreground" : "text-muted-foreground"}`}>
                        {dim.left} — {dim.leftPole} ({leftPct}%)
                      </span>
                      <span className={`font-medium ${!leftWins ? "text-foreground" : "text-muted-foreground"}`}>
                        {dim.rightPole} — {dim.right} ({rightPct}%)
                      </span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                      <div
                        className="rounded-l-full transition-all duration-700"
                        style={{
                          width: `${leftPct}%`,
                          backgroundColor: leftWins ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground) / 0.3)",
                        }}
                      />
                      <div
                        className="rounded-r-full transition-all duration-700"
                        style={{
                          width: `${rightPct}%`,
                          backgroundColor: !leftWins ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground) / 0.3)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Brief description - FREE part */}
            <div className="p-4 rounded-xl bg-muted/50">
              <h3 className="font-heading font-semibold text-foreground mb-2">
                {type} — {typeName}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
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
              Desbloqueie agora para uma análise profunda e personalizada da sua personalidade
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              "Visão geral da personalidade",
              "Pontos fortes naturais",
              "Desafios e crescimento",
              "Como age sob estresse",
              "Comunicação e relacionamentos",
              "Estilo de aprendizado",
              "Carreira ideal e 20 profissões",
              "Liderança e trabalho em equipe",
              "Tomada de decisão",
              "Plano de desenvolvimento pessoal",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>

          {/* Blurred preview */}
          <div className="relative mb-6 rounded-xl overflow-hidden">
            <div className="p-4 bg-muted/30 blur-sm select-none pointer-events-none">
              <h4 className="font-bold text-foreground mb-2">Como o {type} age no mundo</h4>
              <p className="text-sm text-muted-foreground">
                O {type} possui uma forma única de interagir com o mundo. Sua combinação de preferências cria um indivíduo com...
                No ambiente profissional, essas pessoas tendem a se destacar por sua abordagem natural...
                Nos relacionamentos, demonstram uma combinação fascinante de qualidades que...
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

export default MbtiPartialResult;