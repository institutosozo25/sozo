import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MBTI_QUESTIONS } from "../data/mbti-questionnaire";
import { useMbti } from "../contexts/MbtiContext";
import { cn } from "@/lib/utils";

const MbtiQuestionnaire = () => {
  const {
    answers, setAnswer, submitTest, setStep,
    currentQuestionIndex, setCurrentQuestionIndex,
    totalQuestions, answeredCount, canSubmit,
  } = useMbti();

  const question = MBTI_QUESTIONS[currentQuestionIndex];
  const currentAnswer = answers[question.id];
  const progress = (answeredCount / totalQuestions) * 100;

  const handleSelect = (option: "A" | "B") => {
    setAnswer(question.id, option);
    // Auto-advance after small delay
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

  const handleSubmit = () => {
    submitTest();
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
          <h1 className="mb-1 text-2xl font-bold text-foreground font-heading">Teste MBTI</h1>
          <p className="text-sm text-muted-foreground">
            Escolha a opção <strong>A</strong> ou <strong>B</strong> que mais representa seu comportamento natural.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progresso</span>
            <span className="text-muted-foreground">{answeredCount}/{totalQuestions} perguntas</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Quick navigation - show blocks of 10 */}
          <div className="mt-3 flex flex-wrap gap-1">
            {MBTI_QUESTIONS.map((q, i) => {
              const answered = answers[q.id] !== undefined;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-medium transition-all",
                    i === currentQuestionIndex
                      ? "bg-secondary text-secondary-foreground"
                      : answered
                      ? "bg-accent/20 text-accent-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        <div className="mb-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border bg-secondary/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
                {currentQuestionIndex + 1}
              </span>
              <h2 className="text-lg font-semibold text-foreground">{question.text}</h2>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {/* Option A */}
            <button
              onClick={() => handleSelect("A")}
              className={cn(
                "w-full text-left rounded-xl border px-5 py-4 transition-all flex items-start gap-4",
                currentAnswer === "A"
                  ? "border-secondary bg-secondary/10 ring-2 ring-secondary/30"
                  : "border-border bg-background hover:border-secondary/50 hover:bg-secondary/5"
              )}
            >
              <span className={cn(
                "flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                currentAnswer === "A"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                A
              </span>
              <span className="text-sm font-medium text-foreground pt-1">{question.optionA}</span>
            </button>

            {/* Option B */}
            <button
              onClick={() => handleSelect("B")}
              className={cn(
                "w-full text-left rounded-xl border px-5 py-4 transition-all flex items-start gap-4",
                currentAnswer === "B"
                  ? "border-secondary bg-secondary/10 ring-2 ring-secondary/30"
                  : "border-border bg-background hover:border-secondary/50 hover:bg-secondary/5"
              )}
            >
              <span className={cn(
                "flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                currentAnswer === "B"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                B
              </span>
              <span className="text-sm font-medium text-foreground pt-1">{question.optionB}</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} de {totalQuestions}
            {currentAnswer && " ✓"}
          </span>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button onClick={handleNext} disabled={!currentAnswer} className="gap-1">
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Send className="h-4 w-4" /> Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MbtiQuestionnaire;
