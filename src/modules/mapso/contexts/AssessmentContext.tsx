import React, { createContext, useContext, useState, type ReactNode } from "react";
import { type Answers, type AssessmentResult, calculateAssessment } from "../lib/miarpo-engine";
import { generateDiagnosisHtml, generateNR1ReportHtml } from "../lib/nr1-report-generator";
import { generateActionPlan, type ActionPlanItem } from "../lib/action-plan-generator";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizationInfo {
  name: string;
  sector: string;
  department: string;
  employeeCount: string;
}

interface AiEnrichment {
  analise_critica: string;
  recomendacoes_tecnicas: string;
  parecer_tecnico: string;
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
  consentAccepted: boolean;
  setConsentAccepted: (v: boolean) => void;
  diagnosisHtml: string | null;
  reportHtml: string | null;
  actionPlan: ActionPlanItem[];
  assessmentId: string | null;
  isSaving: boolean;
  aiEnrichment: AiEnrichment | null;
  isEnriching: boolean;
  enrichReport: () => Promise<void>;
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
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [diagnosisHtml, setDiagnosisHtml] = useState<string | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[]>([]);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiEnrichment, setAiEnrichment] = useState<AiEnrichment | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const setAnswer = (itemId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const submitAssessment = async () => {
    if (!organization) return;
    const assessmentResult = calculateAssessment(answers);
    setResult(assessmentResult);

    // Generate reports
    const diagnosis = generateDiagnosisHtml(assessmentResult, organization);
    const report = generateNR1ReportHtml(assessmentResult, organization);
    const plan = generateActionPlan(assessmentResult);

    setDiagnosisHtml(diagnosis);
    setReportHtml(report);
    setActionPlan(plan);
    setCurrentStep("results");

    // Save to database
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from("mapso_assessments" as any).insert({
          user_id: user.id,
          organization_name: organization.name,
          organization_sector: organization.sector,
          organization_department: organization.department || null,
          employee_count: organization.employeeCount ? parseInt(organization.employeeCount) : null,
          irp: assessmentResult.irp,
          irp_classification: assessmentResult.irpClassification.label,
          ipp: assessmentResult.ipp,
          ivo: assessmentResult.ivo,
          dimension_scores: assessmentResult.dimensions.map((d) => ({
            id: d.dimensionId,
            name: d.name,
            score: Math.round(d.riskScore),
            classification: d.classification.label,
          })),
          diagnosis_html: diagnosis,
          report_html: report,
          action_plan: plan,
          consent_accepted: consentAccepted,
        } as any).select("id").single();

        if (!error && data) {
          setAssessmentId((data as any).id);
        }
      }
    } catch (e) {
      console.error("Error saving MAPSO assessment:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const loadDemoResult = (demo: AssessmentResult) => {
    const demoOrg = organization || { name: "Empresa Exemplo S.A.", sector: "Tecnologia", department: "", employeeCount: "147" };
    setResult(demo);
    const diagnosis = generateDiagnosisHtml(demo, demoOrg);
    const report = generateNR1ReportHtml(demo, demoOrg);
    const plan = generateActionPlan(demo);
    setDiagnosisHtml(diagnosis);
    setReportHtml(report);
    setActionPlan(plan);
    setCurrentStep("results");
  };

  const resetAssessment = () => {
    setOrganization(null);
    setAnswers({});
    setResult(null);
    setCurrentStep("landing");
    setConsentAccepted(false);
    setDiagnosisHtml(null);
    setReportHtml(null);
    setActionPlan([]);
    setAssessmentId(null);
  };

  return (
    <AssessmentContext.Provider
      value={{
        organization, setOrganization,
        answers, setAnswer,
        result, submitAssessment, loadDemoResult, resetAssessment,
        currentStep, setCurrentStep,
        consentAccepted, setConsentAccepted,
        diagnosisHtml, reportHtml, actionPlan,
        assessmentId, isSaving,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};
