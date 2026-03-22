import { useDisc } from "../contexts/DiscContext";
import { PROFILE_LABELS, PROFILE_COLORS } from "../data/disc-questionnaire";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Check, BarChart3, Sparkles, LogIn, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTestPaywall } from "@/hooks/useTestPaywall";
import { PaymentDialog } from "@/components/payment/PaymentDialog";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCallback } from "react";

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  D: "Pessoas com perfil Dominante são assertivas, diretas e orientadas para resultados. Gostam de assumir o controle, tomar decisões rápidas e superar desafios. São líderes naturais com forte determinação.",
  I: "Pessoas com perfil Influente são comunicativas, entusiastas e sociais. Valorizam relações interpessoais, são persuasivas e trazem energia positiva aos ambientes. São motivadoras naturais.",
  S: "Pessoas com perfil Estável são pacientes, confiáveis e cooperativas. Valorizam harmonia, estabilidade e trabalham bem em equipe. São excelentes ouvintes e apoiadores consistentes.",
  C: "Pessoas com perfil Conforme são analíticas, precisas e organizadas. Valorizam qualidade, lógica e planejamento. São meticulosas nos detalhes e buscam excelência em tudo que fazem.",
};

const DiscPartialResult = () => {
  const { result, setStep, setFullReport, respondentName, respondentEmail } = useDisc();
  const { user } = useAuth();

  if (!result) return null;

  const { primary, secondary, primaryLabel, secondaryLabel, scores, percentages } = result;

  const generateReportFn = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("generate-disc-report", {
      body: { scores, primary, secondary, primaryLabel, secondaryLabel, respondentName },
    });
    if (error) throw error;
    return data.report as string;
  }, [scores, primary, secondary, primaryLabel, secondaryLabel, respondentName]);

  const onReportReady = useCallback((report: string) => {
    setFullReport(report);
    setStep("full-report");
  }, [setFullReport, setStep]);

  const paywall = useTestPaywall({
    testSlug: "disc",
    respondentName,
    respondentEmail,
    scores: { ...scores },
    generateReportFn,
    onReportReady,
  });

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

        {/* Profile Card - MINIMAL FREE RESULT */}
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
            {/* Brief description - FREE part */}
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

        {/* Blurred locked sections */}
        <div className="relative mb-8">
          <div className="space-y-3 blur-sm pointer-events-none select-none" aria-hidden>
            {/* Fake score bars */}
            {(["D", "I", "S", "C"] as const).map((p) => (
              <div key={p} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <span className="w-24 text-sm font-medium text-foreground">{PROFILE_LABELS[p]}</span>
                <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: "60%", backgroundColor: PROFILE_COLORS[p] }} />
                </div>
                <span className="w-10 text-sm font-bold text-foreground text-right">??%</span>
              </div>
            ))}
            {/* Fake advanced sections */}
            <div className="p-5 bg-card rounded-xl border border-border">
              <p className="font-semibold text-foreground mb-1">Análise Psicológica Completa</p>
              <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptates...</p>
            </div>
            <div className="p-5 bg-card rounded-xl border border-border">
              <p className="font-semibold text-foreground mb-1">Pontos Fortes e Fraquezas</p>
              <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi...</p>
            </div>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/90 backdrop-blur-sm border border-border shadow-lg">
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className="font-heading font-bold text-foreground text-center">
                Conteúdo bloqueado
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-[240px]">
                Desbloqueie para ver o relatório completo do DISC
              </p>
            </div>
          </div>
        </div>

        {/* Auth check */}
        {!user && (
          <div className="bg-card border border-accent/30 rounded-2xl p-6 mb-6 text-center">
            <LogIn className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-foreground font-semibold mb-2">Faça login para desbloquear</p>
            <p className="text-muted-foreground text-sm mb-4">
              Crie uma conta gratuita para desbloquear seu relatório completo.
            </p>
            <Button asChild variant="accent">
              <Link to="/auth">Entrar ou Criar Conta</Link>
            </Button>
          </div>
        )}

        {/* Free access banner for subscribers */}
        {user && paywall.isFree && (
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
              onClick={paywall.handleFreeUnlock}
              disabled={paywall.isProcessing}
            >
              {paywall.isProcessing ? (
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
        {user && !paywall.isFree && !paywall.isLoading && (
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

            {paywall.isPaid ? (
              <Button
                variant="accent"
                size="xl"
                className="w-full"
                onClick={paywall.checkAndGenerate}
                disabled={paywall.isProcessing}
              >
                {paywall.isProcessing ? (
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
            ) : (
              <Button
                variant="accent"
                size="xl"
                className="w-full"
                onClick={paywall.handlePaidUnlock}
                disabled={paywall.isProcessing}
              >
                {paywall.isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-foreground border-t-transparent mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Desbloquear Relatório Completo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Payment Dialog */}
        <PaymentDialog
          open={paywall.showPaymentDialog}
          onOpenChange={paywall.setShowPaymentDialog}
          invoiceUrl={paywall.invoiceUrl}
          onCheckPayment={paywall.checkAndGenerate}
          isChecking={paywall.isProcessing}
        />
      </div>
    </div>
  );
};

export default DiscPartialResult;
