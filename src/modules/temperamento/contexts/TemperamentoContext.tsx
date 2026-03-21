import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type TemperamentoAnswers, type TemperamentoResult, calculateTemperamentoScores, isTestComplete } from "../lib/temperamento-engine";
import { TOTAL_QUESTIONS } from "../data/temperamento-questionnaire";
import { saveTestState, loadTestState, clearTestState } from "@/lib/test-state-storage";

const TEST_SLUG = "temperamento";
type Step = "welcome" | "questionnaire" | "partial-result" | "full-report" | "managed-done";

interface TemperamentoContextType {
  step: Step;
  setStep: (s: Step) => void;
  answers: TemperamentoAnswers;
  setAnswer: (questionId: string, optionId: string) => void;
  result: TemperamentoResult | null;
  fullReport: string | null;
  setFullReport: (r: string) => void;
  submitTest: () => TemperamentoResult | null;
  resetTest: () => void;
  respondentName: string;
  setRespondentName: (n: string) => void;
  respondentEmail: string;
  setRespondentEmail: (e: string) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (i: number) => void;
  totalQuestions: number;
  answeredCount: number;
  canSubmit: boolean;
}

const TemperamentoContext = createContext<TemperamentoContextType | null>(null);

export const useTemperamento = () => {
  const ctx = useContext(TemperamentoContext);
  if (!ctx) throw new Error("useTemperamento must be used within TemperamentoProvider");
  return ctx;
};

export const TemperamentoProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<TemperamentoAnswers>({});
  const [result, setResult] = useState<TemperamentoResult | null>(null);
  const [fullReport, setFullReport] = useState<string | null>(null);
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isManaged, setIsManaged] = useState(false);

  const totalQuestions = TOTAL_QUESTIONS;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = isTestComplete(answers);

  useEffect(() => {
    const managedRaw = sessionStorage.getItem("managed_test_context");
    if (managedRaw) {
      try {
        const managed = JSON.parse(managedRaw);
        if (managed.test_type === "temperamento") {
          setRespondentName(managed.colaborador_nome || "Colaborador");
          setRespondentEmail("managed@sozo.app");
          setIsManaged(true);
          setStep("questionnaire");
          return;
        }
      } catch {}
    }
    const saved = loadTestState(TEST_SLUG);
    if (saved && saved.step === "questionnaire") {
      setStep("questionnaire");
      setAnswers(saved.answers as TemperamentoAnswers);
      setCurrentQuestionIndex(saved.currentIndex);
      setRespondentName(saved.respondentName);
      setRespondentEmail(saved.respondentEmail);
    }
  }, []);

  useEffect(() => {
    if (step === "questionnaire" && answeredCount > 0) {
      saveTestState(TEST_SLUG, {
        step, answers, currentIndex: currentQuestionIndex,
        respondentName, respondentEmail, savedAt: Date.now(),
      });
    }
  }, [answers, currentQuestionIndex, step]);

  const setAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  const submitTest = () => {
    if (!canSubmit) return null;
    const r = calculateTemperamentoScores(answers);
    setResult(r);
    clearTestState(TEST_SLUG);

    if (isManaged) {
      sessionStorage.removeItem("managed_test_context");
      setStep("managed-done");
    } else {
      setStep("partial-result");
    }
    return r;
  };

  const resetTest = () => {
    setStep("welcome");
    setAnswers({});
    setResult(null);
    setFullReport(null);
    setRespondentName("");
    setRespondentEmail("");
    setCurrentQuestionIndex(0);
    setIsManaged(false);
    clearTestState(TEST_SLUG);
  };

  return (
    <TemperamentoContext.Provider
      value={{
        step, setStep, answers, setAnswer, result, fullReport, setFullReport,
        submitTest, resetTest, respondentName, setRespondentName,
        respondentEmail, setRespondentEmail, currentQuestionIndex,
        setCurrentQuestionIndex, totalQuestions, answeredCount, canSubmit,
      }}
    >
      {children}
    </TemperamentoContext.Provider>
  );
};
