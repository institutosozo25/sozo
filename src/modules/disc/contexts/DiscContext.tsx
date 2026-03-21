import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type DiscAnswers, type DiscResult, calculateDiscScores, isTestComplete } from "../lib/disc-engine";
import { DISC_QUESTION_GROUPS } from "../data/disc-questionnaire";
import { saveTestState, loadTestState, clearTestState } from "@/lib/test-state-storage";

const TEST_SLUG = "disc";
type Step = "welcome" | "questionnaire" | "partial-result" | "full-report";

interface DiscContextType {
  step: Step;
  setStep: (s: Step) => void;
  answers: DiscAnswers;
  setAnswer: (groupId: string, most: string, least: string) => void;
  result: DiscResult | null;
  fullReport: string | null;
  setFullReport: (r: string) => void;
  submitTest: () => DiscResult | null;
  resetTest: () => void;
  respondentName: string;
  setRespondentName: (n: string) => void;
  respondentEmail: string;
  setRespondentEmail: (e: string) => void;
  currentGroupIndex: number;
  setCurrentGroupIndex: (i: number) => void;
  totalGroups: number;
  answeredCount: number;
  canSubmit: boolean;
}

const DiscContext = createContext<DiscContextType | null>(null);

export const useDisc = () => {
  const ctx = useContext(DiscContext);
  if (!ctx) throw new Error("useDisc must be used within DiscProvider");
  return ctx;
};

export const DiscProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<DiscAnswers>({});
  const [result, setResult] = useState<DiscResult | null>(null);
  const [fullReport, setFullReport] = useState<string | null>(null);
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  const totalGroups = DISC_QUESTION_GROUPS.length;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = isTestComplete(answers);

  useEffect(() => {
    const managedRaw = sessionStorage.getItem("managed_test_context");
    if (managedRaw) {
      try {
        const managed = JSON.parse(managedRaw);
        if (managed.test_type === "disc") {
          setRespondentName(managed.colaborador_nome || "Colaborador");
          setRespondentEmail("managed@sozo.app");
          setStep("questionnaire");
          return;
        }
      } catch {}
    }
    const saved = loadTestState(TEST_SLUG);
    if (saved && saved.step === "questionnaire") {
      setStep("questionnaire");
      setAnswers(saved.answers as DiscAnswers);
      setCurrentGroupIndex(saved.currentIndex);
      setRespondentName(saved.respondentName);
      setRespondentEmail(saved.respondentEmail);
    }
  }, []);

  useEffect(() => {
    if (step === "questionnaire" && answeredCount > 0) {
      saveTestState(TEST_SLUG, {
        step, answers, currentIndex: currentGroupIndex,
        respondentName, respondentEmail, savedAt: Date.now(),
      });
    }
  }, [answers, currentGroupIndex, step]);

  const setAnswer = useCallback((groupId: string, most: string, least: string) => {
    setAnswers((prev) => ({ ...prev, [groupId]: { most, least } }));
  }, []);

  const submitTest = () => {
    if (!canSubmit) return null;
    const r = calculateDiscScores(answers);
    setResult(r);
    setStep("partial-result");
    clearTestState(TEST_SLUG);
    return r;
  };

  const resetTest = () => {
    setStep("welcome");
    setAnswers({});
    setResult(null);
    setFullReport(null);
    setRespondentName("");
    setRespondentEmail("");
    setCurrentGroupIndex(0);
    clearTestState(TEST_SLUG);
  };

  return (
    <DiscContext.Provider
      value={{
        step, setStep, answers, setAnswer, result, fullReport, setFullReport,
        submitTest, resetTest, respondentName, setRespondentName,
        respondentEmail, setRespondentEmail, currentGroupIndex,
        setCurrentGroupIndex, totalGroups, answeredCount, canSubmit,
      }}
    >
      {children}
    </DiscContext.Provider>
  );
};
