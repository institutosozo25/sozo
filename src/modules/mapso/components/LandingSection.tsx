import { Shield, BarChart3, FileText, Activity, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssessment } from "../contexts/AssessmentContext";
import { generateDemoResult } from "../lib/miarpo-engine";
import logoSozo from "../assets/logo-sozo.png";

const features = [
  { icon: Shield, title: "Avaliação Psicométrica", desc: "64 itens em 8 dimensões baseadas em modelos científicos validados" },
  { icon: BarChart3, title: "Índice de Risco (IRP)", desc: "Cálculo ponderado com classificação de risco 0–100" },
  { icon: FileText, title: "Diagnóstico Organizacional", desc: "Relatório com mapa de vulnerabilidade e recomendações" },
  { icon: Activity, title: "Monitoramento", desc: "Comparação longitudinal e acompanhamento de intervenções" },
];

const LandingSection = () => {
  const { setCurrentStep, setOrganization, loadDemoResult } = useAssessment();

  const handleDemo = () => {
    const demo = generateDemoResult();
    setOrganization({ name: "Empresa Exemplo S.A.", sector: "Tecnologia", department: "Todos", employeeCount: "147" });
    loadDemoResult(demo);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary to-primary/80 px-6 py-20 text-primary-foreground">
        <div className="mx-auto max-w-5xl animate-fade-up">
          <img
            src={logoSozo}
            alt="Instituto Plenitude Sozo Business"
            className="mb-8 h-16 md:h-20"
          />
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium">
            <Shield className="h-4 w-4" />
            Conforme NR1 · ISO 45003 · OMS · OIT
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl font-heading">
            MAPSO
          </h1>
          <p className="mb-2 text-xl font-medium opacity-90 md:text-2xl">
            Modelo de Avaliação e Gestão de Riscos Psicossociais Organizacionais
          </p>
          <p className="mb-8 max-w-2xl text-base opacity-75 md:text-lg">
            Ferramenta oficial para conformidade com a NR1 - Riscos Psicossociais. Sistema científico de 
            diagnóstico, mensuração e gestão de riscos psicossociais no trabalho. Baseado nos modelos de Karasek, Siegrist e Maslach.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-base font-semibold"
              onClick={() => setCurrentStep("org-setup")}
            >
              Iniciar Avaliação
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base"
              onClick={handleDemo}
            >
              Ver Dashboard Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground font-heading">
            Componentes do Sistema
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-1.5 text-lg font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dimensions */}
      <section className="border-t border-border bg-muted/50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground font-heading">
            8 Dimensões de Avaliação
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Demanda Psicológica",
              "Controle e Autonomia",
              "Apoio Social",
              "Reconhecimento",
              "Relações Interpessoais",
              "Segurança Psicológica",
              "Saúde Emocional",
              "Engajamento",
            ].map((name, i) => (
              <div key={name} className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
                <span className="mr-2 text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium text-card-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingSection;
