import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MbtiProvider, useMbti } from "./contexts/MbtiContext";
import MbtiWelcome from "./components/MbtiWelcome";
import MbtiQuestionnaire from "./components/MbtiQuestionnaire";
import MbtiPartialResult from "./components/MbtiPartialResult";
import MbtiFullReport from "./components/MbtiFullReport";
import ManagedTestDone from "@/components/managed/ManagedTestDone";

const MbtiContent = () => {
  const { step } = useMbti();

  return (
    <>
      {step === "welcome" && <MbtiWelcome />}
      {step === "questionnaire" && <MbtiQuestionnaire />}
      {step === "partial-result" && <MbtiPartialResult />}
      {step === "full-report" && <MbtiFullReport />}
      {step === "managed-done" && <ManagedTestDone />}
    </>
  );
};

const MbtiApp = () => {
  return (
    <MbtiProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <MbtiContent />
        <Footer />
      </div>
    </MbtiProvider>
  );
};

export default MbtiApp;
