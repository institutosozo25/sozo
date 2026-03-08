import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EneagramaProvider, useEneagrama } from "./contexts/EneagramaContext";
import EneagramaWelcome from "./components/EneagramaWelcome";
import EneagramaQuestionnaire from "./components/EneagramaQuestionnaire";
import EneagramaPartialResult from "./components/EneagramaPartialResult";
import EneagramaFullReport from "./components/EneagramaFullReport";

const EneagramaContent = () => {
  const { step } = useEneagrama();

  return (
    <>
      {step === "welcome" && <EneagramaWelcome />}
      {step === "questionnaire" && <EneagramaQuestionnaire />}
      {step === "partial-result" && <EneagramaPartialResult />}
      {step === "full-report" && <EneagramaFullReport />}
    </>
  );
};

const EneagramaApp = () => {
  return (
    <EneagramaProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <EneagramaContent />
        <Footer />
      </div>
    </EneagramaProvider>
  );
};

export default EneagramaApp;
