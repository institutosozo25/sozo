import React, { createContext, useContext, useState, type ReactNode } from "react";
import { type Answers, type AssessmentResult, calculateAssessment } from "../lib/miarpo-engine";

export interface OrganizationInfo {
  name: string;
  sector: string;
  department: string;
  employeeCount: string;
}

interface AssessmentContextType {
  organization: OrganizationInfo | null;
  setOrganization: (info: OrganizationInfo) => void;
  answers: Answers;
  setAnswer: (itemId: string, value: number) => void;
  result: AssessmentResult | null;
  submitAssessment: () => void;
  loadDemoResult: (demo: AssessmentResult) => void;
  resetAssessment: () => void;
  currentStep: "landing" | "org-setup" | "questionnaire" | "results";
  setCurrentStep: (step: "landing" | "org-setup" | "questionnaire" | "results") => void;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export const useAssessment = () => {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used within AssessmentProvider");
  return ctx;
};

export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [currentStep, setCurrentStep] = useState<"landing" | "org-setup" | "questionnaire" | "results">("landing");

  const setAnswer = (itemId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const submitAssessment = () => {
    const assessmentResult = calculateAssessment(answers);
    setResult(assessmentResult);
    setCurrentStep("results");
  };

  const loadDemoResult = (demo: AssessmentResult) => {
    setResult(demo);
    setCurrentStep("results");
  };

  const resetAssessment = () => {
    setOrganization(null);
    setAnswers({});
    setResult(null);
    setCurrentStep("landing");
  };

  return (
    <AssessmentContext.Provider
      value={{ organization, setOrganization, answers, setAnswer, result, submitAssessment, loadDemoResult, resetAssessment, currentStep, setCurrentStep }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};
