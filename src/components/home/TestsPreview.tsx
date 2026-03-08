import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Brain, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const featuredTests = [
  {
    id: "disc",
    title: "Análise Comportamental DISC Profissional",
    description: "Descubra seu perfil comportamental predominante: Dominância, Influência, Estabilidade ou Conformidade.",
    duration: "15 min",
    questions: 25,
    color: "from-sozo-blue to-secondary",
    icon: Brain,
    route: "/testes/disc",
    popular: true,
  },
  {
    id: "mbti",
    title: "Teste de Personalidade MBTI",
    description: "Identifique seu tipo psicológico entre os 16 perfis de personalidade.",
    duration: "20 min",
    questions: 70,
    color: "from-secondary to-sozo-blue",
    icon: Brain,
    route: "/testes/mbti",
  },
  {
    id: "temperamento",
    title: "Análise de Temperamento Profunda",
    description: "Identifique seu temperamento predominante: Sanguíneo, Colérico, Melancólico ou Fleumático.",
    duration: "15 min",
    questions: 25,
    color: "from-primary to-sozo-blue",
    icon: Brain,
    route: "/testes/temperamento",
  },
  {
    id: "eneagrama",
    title: "Teste Eneagrama",
    description: "Descubra seu tipo entre os 9 perfis de personalidade e motivações profundas.",
    duration: "25 min",
    questions: 135,
    color: "from-sozo-orange to-sozo-red",
    icon: Brain,
    route: "/testes/eneagrama",
  },
  {
    id: "mapso",
    title: "MAPSO",
    description: "Ferramenta de diagnóstico social e saúde emocional para empresas e organizações.",
    duration: "30 min",
    questions: 50,
    color: "from-sozo-brown to-primary",
    icon: BarChart3,
    route: "/mapso",
  },
];

export function TestsPreview() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Ferramentas de Avaliação
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Nossos testes principais
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas cientificamente fundamentadas para desenvolvimento pessoal,
            comportamental e profissional.
          </p>
        </div>

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTests.map((test, index) => (
            <Link
              key={test.id}
              to={test.route}
              className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-sozo-lg animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {test.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold z-10">
                  Popular
                </div>
              )}

              {/* Gradient Header */}
              <div className={cn("h-32 bg-gradient-to-br p-6 flex items-end", test.color)}>
                <div className="w-14 h-14 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
                  <test.icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-heading text-xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                  {test.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {test.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.duration}
                    </span>
                    <span>{test.questions} perguntas</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-secondary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="default" size="lg" asChild>
            <Link to="/testes">
              Ver Todos os Testes
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
