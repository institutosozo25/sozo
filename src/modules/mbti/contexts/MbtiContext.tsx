import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type MbtiAnswers, type MbtiResult, calculateMbtiScores, isTestComplete } from "../lib/mbti-engine";
import { TOTAL_QUESTIONS } from "../data/mbti-questionnaire";
import { saveTestState, loadTestState, clearTestState } from "@/lib/test-state-storage";
import { supabase } from "@/integrations/supabase/client";

const TEST_SLUG = "mbti";
type Step = "welcome" | "questionnaire" | "partial-result" | "full-report" | "managed-done";

interface ManagedContext {
  colaborador_id: string;
  colaborador_nome: string;
  empresa_id?: string;
  profissional_id?: string;
  test_type: string;
  link_id?: string;
}

interface MbtiContextType {
  step: Step;
  setStep: (s: Step) => void;
  answers: MbtiAnswers;
  setAnswer: (questionId: number, answer: "A" | "B") => void;
  result: MbtiResult | null;
  fullReport: string | null;
  setFullReport: (r: string) => void;
  submitTest: () => MbtiResult | null;
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

const MbtiContext = createContext<MbtiContextType | null>(null);

export const useMbti = () => {
  const ctx = useContext(MbtiContext);
  if (!ctx) throw new Error("useMbti must be used within MbtiProvider");
  return ctx;
};

export const MbtiProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<MbtiAnswers>({});
  const [result, setResult] = useState<MbtiResult | null>(null);
  const [fullReport, setFullReport] = useState<string | null>(null);
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isManaged, setIsManaged] = useState(false);
  const [managedCtx, setManagedCtx] = useState<ManagedContext | null>(null);

  const totalQuestions = TOTAL_QUESTIONS;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = isTestComplete(answers);

  useEffect(() => {
    const managedRaw = sessionStorage.getItem("managed_test_context");
    if (managedRaw) {
      try {
        const managed = JSON.parse(managedRaw) as ManagedContext;
        if (managed.test_type === "mbti") {
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
      setAnswers(saved.answers as MbtiAnswers);
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

  const setAnswer = useCallback((questionId: number, answer: "A" | "B") => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const saveManagedResult = async (r: MbtiResult) => {
    if (!managedCtx) return;
    try {
      await supabase.functions.invoke("save-managed-result", {
        body: {
          colaborador_id: managedCtx.colaborador_id,
          empresa_id: managedCtx.empresa_id,
          profissional_id: managedCtx.profissional_id,
          test_type: "mbti",
          link_id: managedCtx.link_id,
          scores: {
            type: r.type,
            typeName: r.typeName,
            scores: r.scores,
            percentages: r.percentages,
            dimensions: r.dimensions,
          },
        },
      });
    } catch (e) {
      console.error("Failed to save managed result:", e);
    }
  };

  const submitTest = () => {
    if (!canSubmit) return null;
    const r = calculateMbtiScores(answers);
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
    <MbtiContext.Provider
      value={{
        step, setStep, answers, setAnswer, result, fullReport, setFullReport,
        submitTest, resetTest, respondentName, setRespondentName,
        respondentEmail, setRespondentEmail, currentQuestionIndex,
        setCurrentQuestionIndex, totalQuestions, answeredCount, canSubmit,
      }}
    >
      {children}
    </MbtiContext.Provider>
  );
};
