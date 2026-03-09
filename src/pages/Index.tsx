import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { NR1Section } from "@/components/home/NR1Section";
import { MapsoHighlight } from "@/components/home/MapsoHighlight";
import { TestsPreview } from "@/components/home/TestsPreview";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { AudienceSection } from "@/components/home/AudienceSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CTASection } from "@/components/home/CTASection";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Instituto Plenitude Sozo | Marketplace de Testes de Desenvolvimento Pessoal</title>
        <meta name="description" content="O maior marketplace de testes de desenvolvimento pessoal do Brasil. Testes DISC, Inteligência Emocional, Temperamento e muito mais com relatórios profissionais completos." />
      </Helmet>
      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSection />
          <NR1Section />
          <MapsoHighlight />
          <TestsPreview />
          <FeaturesSection />
          <AudienceSection />
          <TestimonialsSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
