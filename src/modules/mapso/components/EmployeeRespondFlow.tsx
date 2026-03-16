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
  Shield, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Send, Loader2, Building2,
} from "lucide-react";

type Step = "loading" | "error" | "consent" | "identify" | "questionnaire" | "final-consent" | "done";

interface LinkData {
  id: string;
  empresa_id: string;
  employee_id: string;
  status: string;
  employee_name?: string;
  employee_department?: string;
  company_name?: string;
}

const guidelines = [
  "Responda com sinceridade — não existem respostas certas ou erradas.",
  "Garanta um ambiente tranquilo e sem interrupções para responder.",
  "Suas respostas são anônimas e confidenciais.",
  "O objetivo é a melhoria organizacional e o bem-estar dos colaboradores.",
  "Os dados serão utilizados exclusivamente para fins de diagnóstico psicossocial conforme a NR1.",
];

const EmployeeRespondFlow = () => {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<Step>("loading");
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [error, setError] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [finalConsentAccepted, setFinalConsentAccepted] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [confirmedName, setConfirmedName] = useState("");
  const [confirmedDept, setConfirmedDept] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [currentDimIndex, setCurrentDimIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) loadLink();
  }, [token]);

  const loadLink = async () => {
    const { data, error: err } = await supabase
      .from("mapso_assessment_links" as any)
      .select("id, empresa_id, employee_id, status")
      .eq("token", token)
      .single();

    if (err || !data) {
      setError("Link inválido ou expirado.");
      setStep("error");
      return;
    }

    const link = data as any;
    if (link.status === "completed") {
      setError("Este questionário já foi respondido.");
      setStep("error");
      return;
    }

    // Fetch employee info
    const { data: emp } = await supabase
      .from("mapso_employees" as any)
      .select("name, department")
      .eq("id", link.employee_id)
      .single();

    // Fetch company name
    const { data: company } = await supabase
      .from("empresas")
      .select("razao_social")
      .eq("id", link.empresa_id)
      .single();

    setLinkData({
      ...link,
      employee_name: (emp as any)?.name || "",
      employee_department: (emp as any)?.department || "",
      company_name: (company as any)?.razao_social || "",
    });
    setConfirmedName((emp as any)?.name || "");
    setConfirmedDept((emp as any)?.department || "");
    setStep("consent");
  };

  const handleConsentAccept = () => {
    setStep("identify");
  };

  const handleIdentifySubmit = () => {
    if (!confirmedName.trim()) return;
    setStep("questionnaire");
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
    if (!linkData || !canSubmit) return;
    setSubmitting(true);
    try {
      const result = calculateAssessment(answers);

      // Insert assessment via edge function or directly
      const { error: insertErr } = await supabase.from("mapso_assessments" as any).insert({
        user_id: "00000000-0000-0000-0000-000000000000", // anonymous placeholder
        employee_id: linkData.employee_id,
        empresa_id: linkData.empresa_id,
        link_id: linkData.id,
        organization_name: linkData.company_name || "Empresa",
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
        consent_accepted: consentAccepted,
      } as any);

      if (insertErr) throw insertErr;

      // Update link status
      await supabase
        .from("mapso_assessment_links" as any)
        .update({ status: "completed" } as any)
        .eq("id", linkData.id);

      setStep("done");
    } catch (e) {
      console.error("Submit error:", e);
      setError("Erro ao enviar respostas. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

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
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">Obrigado!</h1>
            <p className="text-muted-foreground">
              Suas respostas foram registradas com sucesso. Este diagnóstico é confidencial e será utilizado
              exclusivamente para a melhoria do ambiente organizacional.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === "consent") {
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
              <h2 className="mb-4 text-lg font-semibold text-foreground">Boas Práticas de Participação</h2>
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
                    Este diagnóstico está em conformidade com a NR1 (Norma Regulamentadora nº 1)
                    e será utilizado para avaliação de riscos psicossociais no ambiente de trabalho.
                  </p>
                </div>
              </div>

              <div className="mb-6 flex items-start gap-3 rounded-lg border border-border p-4">
                <Checkbox
                  id="consent"
                  checked={consentAccepted}
                  onCheckedChange={(checked) => setConsentAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="cursor-pointer text-sm font-medium text-foreground leading-snug">
                  Estou ciente das orientações e concordo em participar da avaliação psicossocial.
                </label>
              </div>

              <Button
                onClick={handleConsentAccept}
                disabled={!consentAccepted}
                className="w-full gap-2"
                size="lg"
              >
                <Shield className="h-4 w-4" /> Continuar
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === "identify") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg animate-fade-up">
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">Confirme seus Dados</h1>
              <p className="text-muted-foreground">Verifique e confirme suas informações antes de iniciar.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input
                  value={confirmedName}
                  onChange={(e) => setConfirmedName(e.target.value)}
                  placeholder="Seu nome completo"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label>Departamento / Setor</Label>
                <Input
                  value={confirmedDept}
                  onChange={(e) => setConfirmedDept(e.target.value)}
                  placeholder="Ex: Administrativo, Comercial"
                  maxLength={100}
                />
              </div>
              <Button
                onClick={handleIdentifySubmit}
                disabled={!confirmedName.trim()}
                className="w-full gap-2"
                size="lg"
              >
                Iniciar Questionário <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <button
              onClick={() => setStep("consent")}
              className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← Voltar
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Questionnaire step
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
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Enviando..." : "Finalizar"}
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
