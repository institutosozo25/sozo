import { useState } from "react";
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TEMPERAMENTO_QUESTIONS } from "../data/temperamento-questionnaire";
import { useTemperamento } from "../contexts/TemperamentoContext";
import { cn } from "@/lib/utils";

const TemperamentoQuestionnaire = () => {
  const {
    answers, setAnswer, submitTest, setStep, currentQuestionIndex,
    setCurrentQuestionIndex, totalQuestions, answeredCount, canSubmit,
  } = useTemperamento();

  const question = TEMPERAMENTO_QUESTIONS[currentQuestionIndex];
  const currentAnswer = answers[question.id];
  const progress = (answeredCount / totalQuestions) * 100;

  const handleSelect = (optionId: string) => {
    setAnswer(question.id, optionId);
    // Auto-advance after short delay
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

  const handleSubmit = async () => {
    await submitTest();
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
          <h1 className="mb-1 text-2xl font-bold text-foreground font-heading">Teste de Temperamento</h1>
          <p className="text-sm text-muted-foreground">
            Escolha a opção que <strong>melhor representa</strong> seu comportamento natural.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progresso</span>
            <span className="text-muted-foreground">{answeredCount}/{totalQuestions} perguntas</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Quick navigation dots */}
          <div className="mt-3 flex flex-wrap gap-1">
            {TEMPERAMENTO_QUESTIONS.map((q, i) => {
              const answered = !!answers[q.id];
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-medium transition-all",
                    i === currentQuestionIndex
                      ? "bg-primary text-primary-foreground"
                      : answered
                      ? "bg-accent/20 text-accent-foreground"
                      : "bg-secondary/10 text-muted-foreground hover:bg-secondary/20"
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
          <div className="border-b border-border bg-primary/5 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {currentQuestionIndex + 1}
              </span>
              <h2 className="text-lg font-semibold text-foreground">{question.title}</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-3">
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    "w-full text-left rounded-lg border px-4 py-3.5 text-sm font-medium transition-all",
                    currentAnswer === opt.id
                      ? "border-accent bg-accent/10 text-foreground ring-2 ring-accent/30"
                      : "border-border bg-background text-foreground hover:border-accent/50 hover:bg-accent/5"
                  )}
                >
                  <span className="inline-flex items-center gap-3">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border",
                      currentAnswer === opt.id
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-muted/50 text-muted-foreground border-border"
                    )}>
                      {opt.letter}
                    </span>
                    {opt.text}
                  </span>
                  {currentAnswer === opt.id && <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-accent" />}
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

export default TemperamentoQuestionnaire;
