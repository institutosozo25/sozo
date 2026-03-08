import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Brain, Heart, Target, Lightbulb, Shield, ArrowRight, Users, Lock, BarChart3 } from "lucide-react";
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
  },
  {
    id: "mbti",
    title: "Teste de Personalidade MBTI",
    description: "Identifique seu tipo psicológico entre os 16 perfis de personalidade baseados na teoria de Carl Jung.",
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
    description: "Descubra seu tipo entre os 9 perfis de personalidade, motivações profundas e padrões emocionais.",
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

const comingSoonTests = [
  {
    id: "inteligencia-emocional",
    title: "Inteligência Emocional",
    description: "Avalie sua capacidade de reconhecer, compreender e gerenciar suas emoções.",
    icon: Heart,
    color: "from-sozo-red to-sozo-orange",
  },
  {
    id: "linguagens-amor",
    title: "Linguagens do Amor",
    description: "Entenda como você expressa e recebe amor em seus relacionamentos.",
    icon: Heart,
    color: "from-sozo-orange to-sozo-beige",
  },
  {
    id: "proposito",
    title: "Propósito de Vida",
    description: "Encontre clareza sobre sua missão, propósito e sentido de vida.",
    icon: Lightbulb,
    color: "from-sozo-brown to-sozo-beige",
  },
  {
    id: "via-character",
    title: "Via Character (Forças)",
    description: "Descubra suas 24 forças de caráter baseadas na psicologia positiva.",
    icon: Shield,
    color: "from-secondary to-accent",
  },
  {
    id: "ansiedade",
    title: "Escala de Ansiedade",
    description: "Avalie seu nível de ansiedade e receba orientações para gerenciá-la.",
    icon: Heart,
    color: "from-sozo-red to-primary",
  },
  {
    id: "depressao",
    title: "Escala de Depressão",
    description: "Identifique sinais de depressão e receba orientações profissionais.",
    icon: Heart,
    color: "from-primary to-sozo-brown",
  },
  {
    id: "perfil-comportamental",
    title: "Perfil Comportamental Completo",
    description: "Análise completa do seu perfil comportamental com múltiplas dimensões.",
    icon: Brain,
    color: "from-sozo-blue to-accent",
  },
  {
    id: "identidade",
    title: "Teste de Identidade",
    description: "Explore sua identidade pessoal, valores fundamentais e crenças.",
    icon: Users,
    color: "from-accent to-sozo-orange",
  },
  {
    id: "espiritual",
    title: "Perfil Espiritual",
    description: "Descubra sua maturidade espiritual e áreas de crescimento.",
    icon: Lightbulb,
    color: "from-sozo-beige to-sozo-brown",
  },
  {
    id: "lideranca",
    title: "Perfil de Liderança",
    description: "Identifique seu estilo de liderança e como potencializar suas habilidades.",
    icon: Target,
    color: "from-primary to-secondary",
  },
];

export default function Testes() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Catálogo de Testes
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Explore nossa coleção de ferramentas de avaliação para desenvolvimento pessoal,
              comportamental, emocional e profissional.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Tests */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-secondary" />
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Ferramentas de Avaliação
              </h2>
            </div>
            <p className="text-muted-foreground">
              Nossas ferramentas principais, prontas para uso imediato.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTests.map((test, index) => (
              <Link
                key={test.id}
                to={test.route}
                className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-sozo-lg animate-fade-up"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {/* Gradient Header */}
                <div className={cn("h-28 bg-gradient-to-br p-5 flex items-end", test.color)}>
                  <div className="w-12 h-12 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
                    <test.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
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
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-muted-foreground" />
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Ferramentas em Desenvolvimento
              </h2>
            </div>
            <p className="text-muted-foreground">
              Novas ferramentas que estão sendo preparadas para você.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {comingSoonTests.map((test, index) => (
              <div
                key={test.id}
                className="relative bg-card rounded-2xl overflow-hidden border border-border opacity-75 animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge variant="secondary" className="bg-muted text-muted-foreground border-border text-xs">
                    Disponível em breve
                  </Badge>
                </div>

                {/* Gradient Header */}
                <div className={cn("h-20 bg-gradient-to-br p-4 flex items-end grayscale-[30%]", test.color)}>
                  <div className="w-10 h-10 rounded-lg bg-background/20 backdrop-blur-sm flex items-center justify-center">
                    <test.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-heading text-base font-bold text-foreground mb-1.5">
                    {test.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {test.description}
                  </p>

                  <Button variant="outline" size="sm" disabled className="w-full">
                    Em breve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
