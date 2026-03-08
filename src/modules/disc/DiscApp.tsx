import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DiscProvider, useDisc } from "./contexts/DiscContext";
import DiscWelcome from "./components/DiscWelcome";
import DiscQuestionnaire from "./components/DiscQuestionnaire";
import DiscPartialResult from "./components/DiscPartialResult";
import DiscFullReport from "./components/DiscFullReport";

const DiscContent = () => {
  const { step } = useDisc();

  return (
    <>
      {step === "welcome" && <DiscWelcome />}
      {step === "questionnaire" && <DiscQuestionnaire />}
      {step === "partial-result" && <DiscPartialResult />}
      {step === "full-report" && <DiscFullReport />}
    </>
  );
};

const DiscApp = () => {
  return (
    <DiscProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <DiscContent />
        <Footer />
      </div>
    </DiscProvider>
  );
};

export default DiscApp;
