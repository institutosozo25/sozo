import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type EneagramaAnswers, type EneagramaResult, calculateEneagramaScores, isTestComplete } from "../lib/eneagrama-engine";
import { ENEAGRAMA_QUESTIONS } from "../data/eneagrama-questionnaire";
import { saveTestState, loadTestState, clearTestState } from "@/lib/test-state-storage";
import { supabase } from "@/integrations/supabase/client";

const TEST_SLUG = "eneagrama";
type Step = "welcome" | "questionnaire" | "partial-result" | "full-report" | "managed-done";

interface ManagedContext {
  colaborador_id: string;
  colaborador_nome: string;
  empresa_id?: string;
  profissional_id?: string;
  test_type: string;
  link_id?: string;
}

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
  const [managedCtx, setManagedCtx] = useState<ManagedContext | null>(null);

  const totalQuestions = ENEAGRAMA_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = isTestComplete(answers);

  useEffect(() => {
    const managedRaw = sessionStorage.getItem("managed_test_context");
    if (managedRaw) {
      try {
        const managed = JSON.parse(managedRaw) as ManagedContext;
        if (managed.test_type === "eneagrama") {
          setRespondentName(managed.colaborador_nome || "Colaborador");
          setRespondentEmail("managed@sozo.app");
          setIsManaged(true);
          setManagedCtx(managed);
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

  const saveManagedResult = async (r: EneagramaResult) => {
    if (!managedCtx) return;
    try {
      await supabase.functions.invoke("save-managed-result", {
        body: {
          colaborador_id: managedCtx.colaborador_id,
          empresa_id: managedCtx.empresa_id,
          profissional_id: managedCtx.profissional_id,
          test_type: "eneagrama",
          link_id: managedCtx.link_id,
          scores: {
            dominant: r.dominant,
            dominantName: r.dominantName,
            wing: r.wing,
            wingName: r.wingName,
            percentages: r.percentages,
          },
        },
      });
    } catch (e) {
      console.error("Failed to save managed result:", e);
    }
  };

  const submitTest = () => {
    if (!canSubmit) return null;
    const r = calculateEneagramaScores(answers);
    setResult(r);
    clearTestState(TEST_SLUG);

    if (isManaged) {
      saveManagedResult(r);
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
    setManagedCtx(null);
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
