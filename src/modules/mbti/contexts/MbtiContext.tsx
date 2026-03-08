import React, { createContext, useContext, useState, type ReactNode } from "react";
import { type MbtiAnswers, type MbtiResult, calculateMbtiScores, isTestComplete } from "../lib/mbti-engine";
import { TOTAL_QUESTIONS } from "../data/mbti-questionnaire";

type Step = "welcome" | "questionnaire" | "partial-result" | "full-report";

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

  const totalQuestions = TOTAL_QUESTIONS;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = isTestComplete(answers);

  const setAnswer = (questionId: number, answer: "A" | "B") => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitTest = () => {
    if (!canSubmit) return null;
    const r = calculateMbtiScores(answers);
    setResult(r);
    setStep("partial-result");
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
