import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TemperamentoProvider, useTemperamento } from "./contexts/TemperamentoContext";
import TemperamentoWelcome from "./components/TemperamentoWelcome";
import TemperamentoQuestionnaire from "./components/TemperamentoQuestionnaire";
import TemperamentoPartialResult from "./components/TemperamentoPartialResult";
import TemperamentoFullReport from "./components/TemperamentoFullReport";
import ManagedTestDone from "@/components/managed/ManagedTestDone";

const TemperamentoContent = () => {
  const { step } = useTemperamento();

  return (
    <>
      {step === "welcome" && <TemperamentoWelcome />}
      {step === "questionnaire" && <TemperamentoQuestionnaire />}
      {step === "partial-result" && <TemperamentoPartialResult />}
      {step === "full-report" && <TemperamentoFullReport />}
      {step === "managed-done" && <ManagedTestDone />}
    </>
  );
};

const TemperamentoApp = () => {
  return (
    <TemperamentoProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <TemperamentoContent />
        <Footer />
      </div>
    </TemperamentoProvider>
  );
};

export default TemperamentoApp;
