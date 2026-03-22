import React, { createContext, useContext, useState, type ReactNode } from "react";
import { type Answers, type AssessmentResult, calculateAssessment } from "../lib/miarpo-engine";
import { generateDiagnosisHtml, generateNR1ReportHtml, type CompanyBranding } from "../lib/nr1-report-generator";
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

    // Fetch company branding if enterprise user
    let branding: CompanyBranding | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: empresa } = await supabase
          .from("empresas")
          .select("logo_url, cnpj, razao_social, nome_fantasia")
          .eq("profile_id", user.id)
          .single();
        if (empresa) {
          branding = {
            logoUrl: empresa.logo_url,
            cnpj: empresa.cnpj,
            razaoSocial: empresa.razao_social,
            nomeFantasia: empresa.nome_fantasia,
          };
        }
      }
    } catch (e) {
      console.warn("Could not fetch company branding:", e);
    }

    // Generate reports
    const diagnosis = generateDiagnosisHtml(assessmentResult, organization, branding);
    const report = generateNR1ReportHtml(assessmentResult, organization, branding);
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

          // Save to test_history so notifications are generated
          await supabase.from("test_history").insert({
            user_id: user.id,
            test_type: "mapso",
            test_name: `MAPSO — ${organization.name}`,
            metadata: {
              assessment_id: (data as any).id,
              irp: assessmentResult.irp,
              irp_classification: assessmentResult.irpClassification.label,
              ipp: assessmentResult.ipp,
              ivo: assessmentResult.ivo,
              scores: {
                irp: assessmentResult.irp,
                irpClassification: assessmentResult.irpClassification.label,
              },
            },
          });
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

  const enrichReport = async () => {
    if (!result || !organization || isEnriching) return;
    setIsEnriching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-mapso-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            organizationName: organization.name,
            sector: organization.sector,
            department: organization.department,
            irp: result.irp,
            irpClassification: result.irpClassification.label,
            ipp: result.ipp,
            ivo: result.ivo,
            dimensions: result.dimensions.map((d) => ({
              id: d.dimensionId,
              name: d.name,
              score: Math.round(d.riskScore),
              classification: d.classification.label,
            })),
            actionPlan: actionPlan.map((a) => ({
              riskFactor: a.riskFactor,
              recommendedAction: a.recommendedAction,
              priority: a.priority,
            })),
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAiEnrichment(data);
    } catch (e) {
      console.error("AI enrichment error:", e);
    } finally {
      setIsEnriching(false);
    }
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
    setAiEnrichment(null);
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
        aiEnrichment, isEnriching, enrichReport,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};
