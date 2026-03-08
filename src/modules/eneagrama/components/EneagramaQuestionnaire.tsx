import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ENEAGRAMA_QUESTIONS, SCALE_OPTIONS } from "../data/eneagrama-questionnaire";
import { useEneagrama } from "../contexts/EneagramaContext";
import { cn } from "@/lib/utils";

const EneagramaQuestionnaire = () => {
  const {
    answers, setAnswer, submitTest, setStep, currentQuestionIndex,
    setCurrentQuestionIndex, totalQuestions, answeredCount, canSubmit,
  } = useEneagrama();

  const question = ENEAGRAMA_QUESTIONS[currentQuestionIndex];
  const currentAnswer = answers[question.id];
  const progress = (answeredCount / totalQuestions) * 100;

  const handleSelect = (value: number) => {
    setAnswer(question.id, value);
    if (currentQuestionIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl animate-fade-up">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setStep("welcome")}
            className="mb-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar
          </button>
          <h1 className="mb-1 text-2xl font-bold text-foreground font-heading">Teste do Eneagrama</h1>
          <p className="text-sm text-muted-foreground">
            Avalie cada afirmação de <strong>Nunca</strong> a <strong>Sempre</strong>.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progresso</span>
            <span className="text-muted-foreground">{answeredCount}/{totalQuestions} perguntas</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <div className="mb-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-primary/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {currentQuestionIndex + 1}
              </span>
              <h2 className="text-base font-medium text-foreground leading-relaxed">{question.text}</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-3">
              {SCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full text-left rounded-lg border px-4 py-3.5 text-sm font-medium transition-all",
                    currentAnswer === opt.value
                      ? "border-accent bg-accent/10 text-foreground ring-2 ring-accent/30"
                      : "border-border bg-background text-foreground hover:border-accent/50 hover:bg-accent/5"
                  )}
                >
                  <span className="inline-flex items-center gap-3">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border",
                      currentAnswer === opt.value
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-muted/50 text-muted-foreground border-border"
                    )}>
                      {opt.value}
                    </span>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} de {totalQuestions}
            {currentAnswer ? " ✓" : ""}
          </span>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext} disabled={!currentAnswer} className="gap-1">
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => submitTest()} disabled={!canSubmit} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Send className="h-4 w-4" /> Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EneagramaQuestionnaire;
