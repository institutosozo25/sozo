import { useDisc } from "../contexts/DiscContext";
import { PROFILE_LABELS, PROFILE_COLORS } from "../data/disc-questionnaire";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Check, BarChart3, Sparkles, LogIn, Crown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTestAccess } from "@/hooks/useTestAccess";
import { toast } from "sonner";
import { saveTestSubmission, saveGeneratedReport } from "@/lib/test-persistence";
import { Link } from "react-router-dom";

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  D: "Pessoas com perfil Dominante são assertivas, diretas e orientadas para resultados. Gostam de assumir o controle, tomar decisões rápidas e superar desafios. São líderes naturais com forte determinação.",
  I: "Pessoas com perfil Influente são comunicativas, entusiastas e sociais. Valorizam relações interpessoais, são persuasivas e trazem energia positiva aos ambientes. São motivadoras naturais.",
  S: "Pessoas com perfil Estável são pacientes, confiáveis e cooperativas. Valorizam harmonia, estabilidade e trabalham bem em equipe. São excelentes ouvintes e apoiadores consistentes.",
  C: "Pessoas com perfil Conforme são analíticas, precisas e organizadas. Valorizam qualidade, lógica e planejamento. São meticulosas nos detalhes e buscam excelência em tudo que fazem.",
};

const DiscPartialResult = () => {
  const { result, setStep, setFullReport, respondentName, respondentEmail } = useDisc();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!result) return null;

  const { primary, secondary, primaryLabel, secondaryLabel, scores, percentages } = result;

  const handleUnlock = async () => {
    if (!user) {
      toast.error("Faça login para gerar seu relatório completo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-disc-report", {
        body: {
          scores,
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

      // Persist submission and report to database
      const submissionId = await saveTestSubmission({
        testSlug: "disc",
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
            {respondentName}, confira seu perfil comportamental
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="gradient-primary p-6 text-center">
            <h2 className="text-primary-foreground font-heading text-2xl font-bold mb-1">
              Perfil {primaryLabel}
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              com traços de {secondaryLabel}
            </p>
          </div>

          <div className="p-6">
            {/* Score bars */}
            <div className="space-y-3 mb-6">
              {(["D", "I", "S", "C"] as const).map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium text-foreground">
                    {PROFILE_LABELS[p]}
                  </span>
                  <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(percentages[p], 5)}%`,
                        backgroundColor: PROFILE_COLORS[p],
                      }}
                    />
                  </div>
                  <span className="w-10 text-sm font-bold text-foreground text-right">
                    {percentages[p]}%
                  </span>
                </div>
              ))}
            </div>

            {/* Brief description */}
            <div className="p-4 rounded-xl bg-muted/50">
              <h3 className="font-heading font-semibold text-foreground mb-2">
                Seu Perfil Predominante: {primaryLabel}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {PROFILE_DESCRIPTIONS[primary]}
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

        {/* Paywall */}
        <div className="bg-card border-2 border-accent/30 rounded-2xl p-8 mb-8">
          <div className="text-center mb-6">
            <Lock className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">
              Seu relatório completo está pronto
            </h3>
            <p className="text-muted-foreground text-sm">
              Desbloqueie agora para uma análise comportamental profunda e personalizada
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              "Análise psicológica completa",
              "Pontos fortes e fraquezas",
              "Motivações e valores",
              "Funcionamento nos relacionamentos",
              "Funcionamento no trabalho",
              "Funcionamento na carreira",
              "Perfil adaptado",
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
              <h4 className="font-bold text-foreground mb-2">Pontos Fortes do Perfil {primaryLabel}-{secondaryLabel}</h4>
              <p className="text-sm text-muted-foreground">
                A combinação dos perfis {primaryLabel} e {secondaryLabel} cria um indivíduo com características únicas...
                Este perfil se destaca por sua capacidade de análise detalhada combinada com visão estratégica...
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

export default DiscPartialResult;
