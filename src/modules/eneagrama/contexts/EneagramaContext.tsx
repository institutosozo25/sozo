import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type EneagramaAnswers, type EneagramaResult, calculateEneagramaScores, isTestComplete } from "../lib/eneagrama-engine";
import { ENEAGRAMA_QUESTIONS } from "../data/eneagrama-questionnaire";
import { saveTestState, loadTestState, clearTestState } from "@/lib/test-state-storage";

const TEST_SLUG = "eneagrama";
type Step = "welcome" | "questionnaire" | "partial-result" | "full-report" | "managed-done";

interface EneagramaContextType {
  step: Step;
  setStep: (s: Step) => void;
  answers: EneagramaAnswers;
  setAnswer: (questionId: string, value: number) => void;
  result: EneagramaResult | null;
  fullReport: string | null;
  setFullReport: (r: string) => void;
  submitTest: () => EneagramaResult | null;
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

const EneagramaContext = createContext<EneagramaContextType | null>(null);

export const useEneagrama = () => {
  const ctx = useContext(EneagramaContext);
  if (!ctx) throw new Error("useEneagrama must be used within EneagramaProvider");
  return ctx;
};

export const EneagramaProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<EneagramaAnswers>({});
  const [result, setResult] = useState<EneagramaResult | null>(null);
  const [fullReport, setFullReport] = useState<string | null>(null);
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isManaged, setIsManaged] = useState(false);

  const totalQuestions = ENEAGRAMA_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = isTestComplete(answers);

  useEffect(() => {
    const managedRaw = sessionStorage.getItem("managed_test_context");
    if (managedRaw) {
      try {
        const managed = JSON.parse(managedRaw);
        if (managed.test_type === "eneagrama") {
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
      setAnswers(saved.answers as EneagramaAnswers);
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

  const setAnswer = useCallback((questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const submitTest = () => {
    if (!canSubmit) return null;
    const r = calculateEneagramaScores(answers);
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
    <EneagramaContext.Provider
      value={{
        step, setStep, answers, setAnswer, result, fullReport, setFullReport,
        submitTest, resetTest, respondentName, setRespondentName,
        respondentEmail, setRespondentEmail, currentQuestionIndex,
        setCurrentQuestionIndex, totalQuestions, answeredCount, canSubmit,
      }}
    >
      {children}
    </EneagramaContext.Provider>
  );
};
