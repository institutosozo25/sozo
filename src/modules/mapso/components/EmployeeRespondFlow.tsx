import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { DIMENSIONS, LIKERT_LABELS } from "../data/miarpo-questionnaire";
import { calculateAssessment, type Answers } from "../lib/miarpo-engine";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Shield, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Send, Loader2, Building2, KeyRound,
} from "lucide-react";

type Step = "loading" | "error" | "validate" | "awareness" | "questionnaire" | "final-consent" | "done";

interface LinkData {
  id: string;
  empresa_id: string;
  test_type: string;
  company_name?: string;
}

interface ColaboradorData {
  id: string;
  nome: string | null;
  setor_id: string | null;
  setor_nome?: string | null;
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const EmployeeRespondFlow = () => {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>("loading");
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [colaborador, setColaborador] = useState<ColaboradorData | null>(null);
  const [error, setError] = useState("");

  // Validation fields
  const [cpfInput, setCpfInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [validating, setValidating] = useState(false);

  // Awareness
  const [awarenessAccepted, setAwarenessAccepted] = useState(false);

  // Final consent
  const [finalConsentAccepted, setFinalConsentAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  // Questionnaire
  const [answers, setAnswers] = useState<Answers>({});
  const [currentDimIndex, setCurrentDimIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) loadLink();
  }, [token]);

  const loadLink = async () => {
    // Look up the generic link from shared_test_links
    const { data, error: err } = await supabase
      .from("shared_test_links")
      .select("id, empresa_id, test_type, status, expires_at")
      .eq("token", token)
      .single();

    if (err || !data) {
      setError("Link inválido ou expirado.");
      setStep("error");
      return;
    }

    if (data.status !== "active") {
      setError("Este link não está mais ativo.");
      setStep("error");
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setError("Este link expirou. Solicite um novo link ao administrador.");
      setStep("error");
      return;
    }

    // Fetch company name
    const { data: company } = await supabase
      .from("empresas")
      .select("razao_social, nome_fantasia")
      .eq("id", data.empresa_id!)
      .single();

    setLinkData({
      id: data.id,
      empresa_id: data.empresa_id!,
      test_type: data.test_type,
      company_name: company?.nome_fantasia || company?.razao_social || "",
    });
    setStep("validate");
  };

  const handleValidate = async () => {
    if (!linkData) return;
    const cpfDigits = cpfInput.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      setValidationError("CPF deve ter 11 dígitos.");
      return;
    }
    if (!dobInput) {
      setValidationError("Informe sua data de nascimento.");
      return;
    }

    setValidating(true);
    setValidationError("");

    try {
      // Validate CPF + DOB against the colaboradores table for this empresa
      const { data: colabs, error: colabErr } = await supabase
        .from("colaboradores")
        .select("id, nome, setor_id, data_nascimento")
        .eq("empresa_id", linkData.empresa_id)
        .eq("cpf" as any, cpfDigits);

      if (colabErr || !colabs || colabs.length === 0) {
        setValidationError("CPF não encontrado. Verifique com o RH da sua empresa.");
        setValidating(false);
        return;
      }

      const match = colabs.find((c: any) => c.data_nascimento === dobInput);
      if (!match) {
        setValidationError("Data de nascimento não corresponde ao cadastro. Verifique com o RH.");
        setValidating(false);
        return;
      }

      // Check if this colaborador already completed MAPSO for this empresa
      const { data: existing } = await supabase
        .from("mapso_assessments")
        .select("id")
        .eq("empresa_id", linkData.empresa_id)
        .eq("colaborador_id" as any, match.id)
        .limit(1);

      if (existing && existing.length > 0) {
        setError("Você já respondeu este questionário.");
        setStep("error");
        setValidating(false);
        return;
      }

      // Fetch setor name if available
      let setorNome: string | null = null;
      if ((match as any).setor_id) {
        const { data: setor } = await supabase
          .from("setores")
          .select("nome")
          .eq("id", (match as any).setor_id)
          .single();
        setorNome = setor?.nome || null;
      }

      setColaborador({
        id: match.id,
        nome: match.nome,
        setor_id: (match as any).setor_id,
        setor_nome: setorNome,
      });

      setStep("awareness");
    } catch {
      setValidationError("Erro ao validar. Tente novamente.");
    } finally {
      setValidating(false);
    }
  };

  const setAnswer = (itemId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const dimension = DIMENSIONS[currentDimIndex];
  const totalItems = DIMENSIONS.reduce((s, d) => s + d.items.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalItems) * 100;
  const canSubmit = answeredCount === totalItems;

  const handleSubmit = async () => {
    if (!linkData || !colaborador || !canSubmit) return;
    setSubmitting(true);
    try {
      const result = calculateAssessment(answers);
      const now = new Date().toISOString();

      // Insert assessment linked to colaborador via colaborador_id
      const { error: insertErr } = await supabase.from("mapso_assessments").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        colaborador_id: colaborador.id,
        employee_id: null,
        empresa_id: linkData.empresa_id,
        link_id: null,
        organization_name: linkData.company_name || "Empresa",
        organization_department: colaborador.setor_nome || null,
        irp: result.irp,
        irp_classification: result.irpClassification.label,
        ipp: result.ipp,
        ivo: result.ivo,
        dimension_scores: result.dimensions.map((d) => ({
          id: d.dimensionId,
          name: d.name,
          score: Math.round(d.riskScore),
          classification: d.classification.label,
        })),
        consent_accepted: true,
        final_consent_accepted: finalConsentAccepted,
        final_consent_at: now,
        signature_name: signatureName.trim(),
      } as any);

      if (insertErr) throw insertErr;

      setStep("done");
    } catch (e) {
      console.error("Submit error:", e);
      setError("Erro ao enviar respostas. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDERS ---

  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">Link Indisponível</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === "done") {
    const completionDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">Obrigado!</h1>
            <p className="text-muted-foreground mb-4">
              Suas respostas foram registradas com sucesso. Este diagnóstico é confidencial e será utilizado
              exclusivamente para a melhoria do ambiente organizacional.
            </p>
            <p className="text-xs text-muted-foreground">
              Registrado em: {completionDate}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // STEP: VALIDATE (CPF + Data de Nascimento)
  if (step === "validate") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg animate-fade-up">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <KeyRound className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">
                Validação de Acesso
              </h1>
              {linkData?.company_name && (
                <p className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {linkData.company_name}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Para garantir a segurança, informe seus dados de identificação.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf-validate">CPF *</Label>
                <Input
                  id="cpf-validate"
                  value={cpfInput}
                  onChange={(e) => setCpfInput(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob-validate">Data de Nascimento *</Label>
                <Input
                  id="dob-validate"
                  type="date"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              {validationError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {validationError}
                  </p>
                </div>
              )}

              <Button
                onClick={handleValidate}
                disabled={validating || !cpfInput.trim() || !dobInput}
                className="w-full gap-2"
                size="lg"
              >
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {validating ? "Validando..." : "Validar e Continuar"}
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Seus dados são usados apenas para validação e não serão associados às suas respostas.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // STEP: AWARENESS (Conscientização obrigatória)
  if (step === "awareness") {
    const guidelines = [
      "Suas respostas são completamente anônimas — nem o RH nem a gestão terão acesso às respostas individuais.",
      "Os dados serão utilizados exclusivamente para diagnóstico psicossocial conforme a NR1 (Norma Regulamentadora nº 1).",
      "Responda com sinceridade — não existem respostas certas ou erradas.",
      "Garanta um ambiente tranquilo e sem interrupções para responder.",
      "O objetivo é a melhoria do ambiente de trabalho e o bem-estar de todos os colaboradores.",
    ];

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg animate-fade-up">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">
                Avaliação Psicossocial — MAPSO
              </h1>
              {linkData?.company_name && (
                <p className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {linkData.company_name}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Antes de Iniciar — Leia com Atenção</h2>
              <div className="space-y-3 mb-6">
                {guidelines.map((text, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm text-foreground">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p className="text-xs text-muted-foreground">
                    <strong>Anonimato garantido:</strong> Suas respostas individuais nunca serão compartilhadas.
                    O RH receberá apenas dados consolidados e agregados por setor.
                  </p>
                </div>
              </div>

              <div className="mb-6 flex items-start gap-3 rounded-lg border border-border p-4">
                <Checkbox
                  id="awareness"
                  checked={awarenessAccepted}
                  onCheckedChange={(checked) => setAwarenessAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="awareness" className="cursor-pointer text-sm font-medium text-foreground leading-snug">
                  Estou ciente das orientações acima e concordo em participar da avaliação psicossocial de forma voluntária.
                </label>
              </div>

              <Button
                onClick={() => setStep("questionnaire")}
                disabled={!awarenessAccepted}
                className="w-full gap-2"
                size="lg"
              >
                <Shield className="h-4 w-4" /> Iniciar Questionário
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // STEP: FINAL CONSENT (Termo final pós-teste)
  if (step === "final-consent") {
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg animate-fade-up">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <Shield className="h-8 w-8" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">Termo de Consentimento Final</h1>
              <p className="text-muted-foreground">Confirme sua participação antes de enviar.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Confirmo que respondi este questionário na data <strong>{today}</strong>, de forma{" "}
                  <strong>voluntária e consciente</strong>, com base na minha experiência profissional nos últimos
                  3 meses. Estou ciente de que as informações serão utilizadas exclusivamente para fins de
                  diagnóstico psicossocial organizacional, em conformidade com a NR-1, e que minhas respostas
                  individuais permanecerão <strong>anônimas e confidenciais</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Checkbox
                  id="final-consent"
                  checked={finalConsentAccepted}
                  onCheckedChange={(checked) => setFinalConsentAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="final-consent" className="cursor-pointer text-sm font-medium text-foreground leading-snug">
                  Declaro que respondi de forma voluntária e consciente, e concordo com os termos acima.
                </label>
              </div>

              <div className="space-y-2">
                <Label>Assinatura digital (nome completo) *</Label>
                <Input
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  maxLength={200}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!finalConsentAccepted || !signatureName.trim() || submitting}
                className="w-full gap-2"
                size="lg"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Enviando..." : "Enviar Respostas"}
              </Button>
            </div>

            <button
              onClick={() => setStep("questionnaire")}
              className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← Voltar ao questionário
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // STEP: QUESTIONNAIRE
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="px-4 py-8 pt-24">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <div className="mb-6">
            <h1 className="mb-1 text-2xl font-bold text-foreground font-heading">Questionário MAPSO</h1>
            <p className="text-sm text-muted-foreground">
              Indique com que frequência cada afirmação reflete sua experiência nos últimos 3 meses.
            </p>
          </div>

          {/* Progress */}
          <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Progresso geral</span>
              <span className="text-muted-foreground">{answeredCount}/{totalItems} itens</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {DIMENSIONS.map((dim, i) => {
                const completed = dim.items.every((item) => answers[item.id] !== undefined);
                return (
                  <button
                    key={dim.id}
                    onClick={() => setCurrentDimIndex(i)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      i === currentDimIndex
                        ? "bg-primary text-primary-foreground"
                        : completed
                        ? "bg-accent/15 text-accent-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {completed && <CheckCircle2 className="h-3 w-3" />}
                    {dim.shortName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimension Content */}
          <div className="mb-6 rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-primary/5 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  {currentDimIndex + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{dimension.name}</h2>
                  <p className="text-xs text-muted-foreground">{dimension.description}</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border">
              {dimension.items.map((item, itemIdx) => (
                <div key={item.id} className="px-6 py-4">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    <span className="mr-2 text-muted-foreground">{itemIdx + 1}.</span>
                    {item.text}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {LIKERT_LABELS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setAnswer(item.id, opt.value)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          answers[item.id] === opt.value
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5"
                        )}
                      >
                        {opt.value} — {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pb-8">
            <Button
              variant="outline"
              onClick={() => { setCurrentDimIndex((i) => i - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={currentDimIndex === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Dimensão {currentDimIndex + 1} de {DIMENSIONS.length}
            </span>
            {currentDimIndex < DIMENSIONS.length - 1 ? (
              <Button
                onClick={() => { setCurrentDimIndex((i) => i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="gap-1"
              >
                Próxima <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!canSubmit) return;
                  setSignatureName("");
                  setStep("final-consent");
                }}
                disabled={!canSubmit}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Finalizar <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmployeeRespondFlow;
