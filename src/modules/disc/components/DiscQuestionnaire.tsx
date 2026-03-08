import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DISC_QUESTION_GROUPS } from "../data/disc-questionnaire";
import { useDisc } from "../contexts/DiscContext";
import { cn } from "@/lib/utils";

const DiscQuestionnaire = () => {
  const { answers, setAnswer, submitTest, setStep, currentGroupIndex, setCurrentGroupIndex, totalGroups, answeredCount, canSubmit } = useDisc();

  const group = DISC_QUESTION_GROUPS[currentGroupIndex];
  const currentAnswer = answers[group.id];
  const progress = (answeredCount / totalGroups) * 100;

  const [selectedMost, setSelectedMost] = useState<string | null>(currentAnswer?.most || null);
  const [selectedLeast, setSelectedLeast] = useState<string | null>(currentAnswer?.least || null);

  // Sync local state when navigating
  const syncState = (index: number) => {
    const g = DISC_QUESTION_GROUPS[index];
    const a = answers[g.id];
    setSelectedMost(a?.most || null);
    setSelectedLeast(a?.least || null);
  };

  const handleSelectMost = (optionId: string) => {
    if (optionId === selectedLeast) return; // can't be same
    setSelectedMost(optionId);
    if (selectedLeast) {
      setAnswer(group.id, optionId, selectedLeast);
    }
  };

  const handleSelectLeast = (optionId: string) => {
    if (optionId === selectedMost) return; // can't be same
    setSelectedLeast(optionId);
    if (selectedMost) {
      setAnswer(group.id, selectedMost, optionId);
    }
  };

  const handleNext = () => {
    if (currentGroupIndex < totalGroups - 1) {
      const next = currentGroupIndex + 1;
      setCurrentGroupIndex(next);
      syncState(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentGroupIndex > 0) {
      const prev = currentGroupIndex - 1;
      setCurrentGroupIndex(prev);
      syncState(prev);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    submitTest();
  };

  const isGroupComplete = selectedMost && selectedLeast && selectedMost !== selectedLeast;

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
          <h1 className="mb-1 text-2xl font-bold text-foreground font-heading">Teste DISC</h1>
          <p className="text-sm text-muted-foreground">
            Para cada pergunta, escolha a opção que <strong>MAIS</strong> e a que <strong>MENOS</strong> representa seu comportamento.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progresso</span>
            <span className="text-muted-foreground">{answeredCount}/{totalGroups} perguntas</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Quick navigation dots */}
          <div className="mt-3 flex flex-wrap gap-1">
            {DISC_QUESTION_GROUPS.map((g, i) => {
              const answered = !!answers[g.id];
              return (
                <button
                  key={g.id}
                  onClick={() => { setCurrentGroupIndex(i); syncState(i); }}
                  className={cn(
                    "w-7 h-7 rounded-md text-xs font-medium transition-all",
                    i === currentGroupIndex
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
                {currentGroupIndex + 1}
              </span>
              <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
            </div>
          </div>

          <div className="p-6">
            {/* MOST selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold">+</span>
                Qual opção <span className="text-accent">MAIS</span> representa você?
              </p>
              <div className="grid gap-2">
                {group.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectMost(opt.id)}
                    disabled={opt.id === selectedLeast}
                    className={cn(
                      "w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                      selectedMost === opt.id
                        ? "border-accent bg-accent/10 text-foreground ring-2 ring-accent/30"
                        : opt.id === selectedLeast
                        ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
                        : "border-border bg-background text-foreground hover:border-accent/50 hover:bg-accent/5"
                    )}
                  >
                    {opt.text}
                    {selectedMost === opt.id && <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-accent" />}
                  </button>
                ))}
              </div>
            </div>

            {/* LEAST selection */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive/20 text-destructive text-xs font-bold">−</span>
                Qual opção <span className="text-destructive">MENOS</span> representa você?
              </p>
              <div className="grid gap-2">
                {group.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectLeast(opt.id)}
                    disabled={opt.id === selectedMost}
                    className={cn(
                      "w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                      selectedLeast === opt.id
                        ? "border-destructive bg-destructive/10 text-foreground ring-2 ring-destructive/30"
                        : opt.id === selectedMost
                        ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
                        : "border-border bg-background text-foreground hover:border-destructive/50 hover:bg-destructive/5"
                    )}
                  >
                    {opt.text}
                    {selectedLeast === opt.id && <CheckCircle2 className="inline-block ml-2 h-4 w-4 text-destructive" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={currentGroupIndex === 0} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentGroupIndex + 1} de {totalGroups}
            {isGroupComplete && " ✓"}
          </span>

          {currentGroupIndex < totalGroups - 1 ? (
            <Button onClick={handleNext} disabled={!isGroupComplete} className="gap-1">
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

export default DiscQuestionnaire;
