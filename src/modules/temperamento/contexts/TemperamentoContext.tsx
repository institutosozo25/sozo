import React, { createContext, useContext, useState, type ReactNode } from "react";
import { type TemperamentoAnswers, type TemperamentoResult, calculateTemperamentoScores, isTestComplete } from "../lib/temperamento-engine";
import { TOTAL_QUESTIONS } from "../data/temperamento-questionnaire";

type Step = "welcome" | "questionnaire" | "partial-result" | "full-report";

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

  const totalQuestions = TOTAL_QUESTIONS;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = isTestComplete(answers);

  const setAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const submitTest = () => {
    if (!canSubmit) return null;
    const r = calculateTemperamentoScores(answers);
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
