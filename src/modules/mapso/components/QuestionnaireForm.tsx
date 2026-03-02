import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DIMENSIONS, LIKERT_LABELS } from "../data/miarpo-questionnaire";
import { useAssessment } from "../contexts/AssessmentContext";
import { cn } from "@/lib/utils";

const QuestionnaireForm = () => {
  const { answers, setAnswer, submitAssessment, setCurrentStep } = useAssessment();
  const [currentDimIndex, setCurrentDimIndex] = useState(0);

  const dimension = DIMENSIONS[currentDimIndex];
  const totalItems = DIMENSIONS.reduce((s, d) => s + d.items.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalItems) * 100;

  const dimAnswered = useMemo(
    () => dimension.items.filter((item) => answers[item.id] !== undefined).length,
    [dimension, answers]
  );
  const dimComplete = dimAnswered === dimension.items.length;

  const canSubmit = answeredCount === totalItems;

  const handleNext = () => {
    if (currentDimIndex < DIMENSIONS.length - 1) {
      setCurrentDimIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentDimIndex > 0) {
      setCurrentDimIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl animate-fade-up">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setCurrentStep("org-setup")}
            className="mb-3 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar
          </button>
          <h1 className="mb-1 text-2xl font-bold text-foreground font-heading">Questionário MAPSO</h1>
          <p className="text-sm text-muted-foreground">
            Indique com que frequência cada afirmação reflete sua experiência nos últimos 3 meses. Respostas confidenciais.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progresso geral</span>
            <span className="text-muted-foreground">{answeredCount}/{totalItems} itens</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Dimension tabs */}
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
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentDimIndex === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            Dimensão {currentDimIndex + 1} de {DIMENSIONS.length}
            {dimComplete && " ✓"}
          </span>

          {currentDimIndex < DIMENSIONS.length - 1 ? (
            <Button onClick={handleNext} className="gap-1">
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submitAssessment} disabled={!canSubmit} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Send className="h-4 w-4" /> Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireForm;
