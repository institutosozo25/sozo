import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AssessmentProvider, useAssessment } from "./contexts/AssessmentContext";
import LandingSection from "./components/LandingSection";
import OrgSetupForm from "./components/OrgSetupForm";
import QuestionnaireForm from "./components/QuestionnaireForm";
import ResultsDashboard from "./components/ResultsDashboard";

const AssessmentFlow = () => {
  const { currentStep } = useAssessment();

  switch (currentStep) {
    case "landing":
      return <LandingSection />;
    case "org-setup":
      return <OrgSetupForm />;
    case "questionnaire":
      return <QuestionnaireForm />;
    case "results":
      return <ResultsDashboard />;
    default:
      return <LandingSection />;
  }
};

const MapsoApp = () => (
  <div className="min-h-screen">
    <Header />
    <main className="pt-20">
      <AssessmentProvider>
        <AssessmentFlow />
      </AssessmentProvider>
    </main>
    <Footer />
  </div>
);

export default MapsoApp;
