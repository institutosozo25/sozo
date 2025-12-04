import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Star, Brain, Heart, Users, Target, Lightbulb, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "Todos", icon: Star },
  { id: "comportamental", name: "Comportamental", icon: Brain },
  { id: "emocional", name: "Emocional", icon: Heart },
  { id: "profissional", name: "Profissional", icon: Target },
  { id: "espiritual", name: "Espiritual", icon: Lightbulb },
];

const featuredTests = [
  {
    id: "disc",
    title: "Teste DISC",
    category: "comportamental",
    description: "Descubra seu perfil comportamental e como você se relaciona com outros.",
    duration: "15 min",
    questions: 28,
    color: "from-sozo-blue to-secondary",
    icon: Brain,
    popular: true,
  },
  {
    id: "inteligencia-emocional",
    title: "Inteligência Emocional",
    category: "emocional",
    description: "Avalie sua capacidade de reconhecer e gerenciar emoções.",
    duration: "12 min",
    questions: 24,
    color: "from-sozo-red to-sozo-orange",
    icon: Heart,
  },
  {
    id: "linguagens-amor",
    title: "Linguagens do Amor",
    category: "emocional",
    description: "Entenda como você expressa e recebe amor em seus relacionamentos.",
    duration: "10 min",
    questions: 20,
    color: "from-sozo-orange to-sozo-beige",
    icon: Heart,
  },
  {
    id: "temperamento",
    title: "Temperamento",
    category: "comportamental",
    description: "Identifique seu temperamento predominante e características.",
    duration: "15 min",
    questions: 30,
    color: "from-primary to-sozo-blue",
    icon: Users,
  },
  {
    id: "proposito",
    title: "Propósito de Vida",
    category: "espiritual",
    description: "Encontre clareza sobre sua missão e propósito de vida.",
    duration: "20 min",
    questions: 35,
    color: "from-sozo-brown to-sozo-beige",
    icon: Lightbulb,
  },
  {
    id: "via-character",
    title: "Via Character",
    category: "profissional",
    description: "Descubra suas forças de caráter e como potencializá-las.",
    duration: "25 min",
    questions: 40,
    color: "from-secondary to-accent",
    icon: Shield,
  },
];

export function TestsPreview() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Catálogo de Testes
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Explore nossos testes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Mais de 50 testes cientificamente validados para desenvolvimento pessoal, 
            emocional, comportamental e profissional.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                category.id === "all"
                  ? "bg-primary text-primary-foreground shadow-sozo-sm"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              )}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </button>
          ))}
        </div>

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTests.map((test, index) => (
            <Link
              key={test.id}
              to={`/testes/${test.id}`}
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
