import { useMbti } from "../contexts/MbtiContext";
import { DIMENSION_LABELS, MBTI_TYPE_DESCRIPTIONS } from "../data/mbti-questionnaire";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Check, BarChart3, Sparkles, LogIn, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTestPaywall } from "@/hooks/useTestPaywall";
import { PaymentDialog } from "@/components/payment/PaymentDialog";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCallback } from "react";

const MbtiPartialResult = () => {
  const { result, setStep, setFullReport, respondentName, respondentEmail } = useMbti();
  const { user } = useAuth();

  if (!result) return null;

  const { type, typeName, dimensions, percentages } = result;
  const description = MBTI_TYPE_DESCRIPTIONS[type] || "";

  const dimensionPairs = [
    { key: "EI", left: "E", right: "I", leftPole: DIMENSION_LABELS.E, rightPole: DIMENSION_LABELS.I },
    { key: "SN", left: "S", right: "N", leftPole: DIMENSION_LABELS.S, rightPole: DIMENSION_LABELS.N },
    { key: "TF", left: "T", right: "F", leftPole: DIMENSION_LABELS.T, rightPole: DIMENSION_LABELS.F },
    { key: "JP", left: "J", right: "P", leftPole: DIMENSION_LABELS.J, rightPole: DIMENSION_LABELS.P },
  ];

  const generateReportFn = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("generate-mbti-report", {
      body: { scores: result.scores, type, typeName, dimensions: result.dimensions, percentages, respondentName },
    });
    if (error) throw error;
    return data.report as string;
  }, [result, type, typeName, percentages, respondentName]);

  const onReportReady = useCallback((report: string) => {
    setFullReport(report);
    setStep("full-report");
  }, [setFullReport, setStep]);

  const paywall = useTestPaywall({
    testSlug: "mbti",
    respondentName,
    respondentEmail,
    scores: { ...result.scores },
    generateReportFn,
    onReportReady,
  });

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl animate-fade-up">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Teste Concluído!</h1>
          <p className="text-muted-foreground text-lg">{respondentName}, confira seu tipo de personalidade</p>
        </div>

        {/* Type Card - MINIMAL FREE RESULT */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
          <div className="gradient-primary p-8 text-center">
            <p className="text-primary-foreground/70 text-sm mb-2">Seu Tipo de Personalidade</p>
            <h2 className="text-primary-foreground font-heading text-4xl font-bold mb-1">{type}</h2>
            <p className="text-primary-foreground/90 text-xl font-medium">{typeName}</p>
          </div>
          <div className="p-6">
            <div className="p-4 rounded-xl bg-muted/50">
              <h3 className="font-heading font-semibold text-foreground mb-2">{type} — {typeName}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        </div>

        {/* Blurred locked sections */}
        <div className="relative mb-8">
          <div className="space-y-3 blur-sm pointer-events-none select-none" aria-hidden>
            {dimensionPairs.map((dim) => (
              <div key={dim.key} className="p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{dim.left} — {dim.leftPole}</span>
                  <span className="font-medium text-muted-foreground">{dim.rightPole} — {dim.right}</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  <div className="rounded-l-full bg-secondary" style={{ width: "55%" }} />
                  <div className="rounded-r-full bg-muted-foreground/30" style={{ width: "45%" }} />
                </div>
              </div>
            ))}
            <div className="p-5 bg-card rounded-xl border border-border">
              <p className="font-semibold text-foreground mb-1">Visão Geral da Personalidade</p>
              <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet consectetur...</p>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/90 backdrop-blur-sm border border-border shadow-lg">
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className="font-heading font-bold text-foreground text-center">Conteúdo bloqueado</p>
              <p className="text-sm text-muted-foreground text-center max-w-[240px]">Desbloqueie para ver o relatório completo do MBTI</p>
            </div>
          </div>
        </div>

        {!user && (
          <div className="bg-card border border-accent/30 rounded-2xl p-6 mb-6 text-center">
            <LogIn className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-foreground font-semibold mb-2">Faça login para desbloquear</p>
            <p className="text-muted-foreground text-sm mb-4">Crie uma conta gratuita para desbloquear seu relatório completo.</p>
            <Button asChild variant="accent"><Link to="/auth">Entrar ou Criar Conta</Link></Button>
          </div>
        )}

        {user && paywall.isFree && (
          <div className="bg-card border-2 border-green-500/30 rounded-2xl p-6 mb-8 text-center">
            <Crown className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">Relatório incluso no seu plano!</h3>
            <p className="text-muted-foreground text-sm mb-6">Como assinante, você tem acesso gratuito ao relatório completo.</p>
            <Button variant="accent" size="xl" className="w-full max-w-sm" onClick={paywall.handleFreeUnlock} disabled={paywall.isProcessing}>
              {paywall.isProcessing ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-foreground border-t-transparent mr-2" />Gerando relatório...</>
              ) : (
                <><BarChart3 className="w-5 h-5 mr-2" />Gerar Meu Relatório Completo<ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </div>
        )}

        {user && !paywall.isFree && !paywall.isLoading && (
          <div className="bg-card border-2 border-accent/30 rounded-2xl p-8 mb-8">
            <div className="text-center mb-6">
              <Lock className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">Seu relatório completo está pronto</h3>
              <p className="text-muted-foreground text-sm">Desbloqueie agora para uma análise profunda e personalizada da sua personalidade</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {["Visão geral da personalidade", "Pontos fortes naturais", "Desafios e crescimento", "Como age sob estresse", "Comunicação e relacionamentos", "Estilo de aprendizado", "Carreira ideal e 20 profissões", "Liderança e trabalho em equipe", "Tomada de decisão", "Plano de desenvolvimento pessoal"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
            {paywall.isPaid ? (
              <Button variant="accent" size="xl" className="w-full" onClick={paywall.checkAndGenerate} disabled={paywall.isProcessing}>
                {paywall.isProcessing ? (<><div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-foreground border-t-transparent mr-2" />Gerando relatório...</>) : (<><BarChart3 className="w-5 h-5 mr-2" />Gerar Meu Relatório Completo<ArrowRight className="w-5 h-5 ml-2" /></>)}
              </Button>
            ) : (
              <Button variant="accent" size="xl" className="w-full" onClick={paywall.handlePaidUnlock} disabled={paywall.isProcessing}>
                {paywall.isProcessing ? (<><div className="animate-spin rounded-full h-5 w-5 border-2 border-accent-foreground border-t-transparent mr-2" />Processando...</>) : (<><Lock className="w-5 h-5 mr-2" />Desbloquear Relatório Completo<ArrowRight className="w-5 h-5 ml-2" /></>)}
              </Button>
            )}
          </div>
        )}

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

export default MbtiPartialResult;
