import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Search, Star, Brain, Heart, Users, Target, Lightbulb, Shield, ArrowRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "Todos", icon: Star, count: 50 },
  { id: "comportamental", name: "Comportamental", icon: Brain, count: 12 },
  { id: "emocional", name: "Emocional", icon: Heart, count: 15 },
  { id: "profissional", name: "Profissional", icon: Target, count: 10 },
  { id: "espiritual", name: "Espiritual", icon: Lightbulb, count: 8 },
  { id: "identidade", name: "Identidade", icon: Users, count: 5 },
];

const allTests = [
  {
    id: "disc",
    title: "Teste DISC",
    category: "comportamental",
    description: "Descubra seu perfil comportamental predominante: Dominância, Influência, Estabilidade ou Conformidade.",
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
    description: "Avalie sua capacidade de reconhecer, compreender e gerenciar suas emoções e as dos outros.",
    duration: "12 min",
    questions: 24,
    color: "from-sozo-red to-sozo-orange",
    icon: Heart,
    popular: true,
  },
  {
    id: "linguagens-amor",
    title: "Linguagens do Amor",
    category: "emocional",
    description: "Entenda como você expressa e recebe amor em seus relacionamentos pessoais.",
    duration: "10 min",
    questions: 20,
    color: "from-sozo-orange to-sozo-beige",
    icon: Heart,
  },
  {
    id: "temperamento",
    title: "Temperamento",
    category: "comportamental",
    description: "Identifique seu temperamento predominante: Sanguíneo, Colérico, Melancólico ou Fleumático.",
    duration: "15 min",
    questions: 30,
    color: "from-primary to-sozo-blue",
    icon: Brain,
  },
  {
    id: "proposito",
    title: "Propósito de Vida",
    category: "espiritual",
    description: "Encontre clareza sobre sua missão, propósito e sentido de vida através de reflexões profundas.",
    duration: "20 min",
    questions: 35,
    color: "from-sozo-brown to-sozo-beige",
    icon: Lightbulb,
    popular: true,
  },
  {
    id: "via-character",
    title: "Via Character (Forças)",
    category: "profissional",
    description: "Descubra suas 24 forças de caráter baseadas na psicologia positiva de Martin Seligman.",
    duration: "25 min",
    questions: 40,
    color: "from-secondary to-accent",
    icon: Shield,
  },
  {
    id: "ansiedade",
    title: "Escala de Ansiedade",
    category: "emocional",
    description: "Avalie seu nível de ansiedade e receba orientações para gerenciá-la de forma saudável.",
    duration: "8 min",
    questions: 21,
    color: "from-sozo-red to-primary",
    icon: Heart,
  },
  {
    id: "depressao",
    title: "Escala de Depressão",
    category: "emocional",
    description: "Identifique sinais de depressão e receba orientações para buscar ajuda profissional.",
    duration: "8 min",
    questions: 21,
    color: "from-primary to-sozo-brown",
    icon: Heart,
  },
  {
    id: "perfil-comportamental",
    title: "Perfil Comportamental Completo",
    category: "comportamental",
    description: "Análise completa do seu perfil comportamental com múltiplas dimensões e aspectos.",
    duration: "30 min",
    questions: 50,
    color: "from-sozo-blue to-accent",
    icon: Brain,
  },
  {
    id: "identidade",
    title: "Teste de Identidade",
    category: "identidade",
    description: "Explore sua identidade pessoal, valores fundamentais e crenças que definem quem você é.",
    duration: "18 min",
    questions: 32,
    color: "from-accent to-sozo-orange",
    icon: Users,
  },
  {
    id: "espiritual",
    title: "Perfil Espiritual",
    category: "espiritual",
    description: "Descubra sua maturidade espiritual e áreas de crescimento na sua jornada de fé.",
    duration: "20 min",
    questions: 36,
    color: "from-sozo-beige to-sozo-brown",
    icon: Lightbulb,
  },
  {
    id: "lideranca",
    title: "Perfil de Liderança",
    category: "profissional",
    description: "Identifique seu estilo de liderança e descubra como potencializar suas habilidades.",
    duration: "15 min",
    questions: 28,
    color: "from-primary to-secondary",
    icon: Target,
  },
];

export default function Testes() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTests = allTests.filter((test) => {
    const matchesCategory = activeCategory === "all" || test.category === activeCategory;
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
              Explore nossa coleção completa de testes de desenvolvimento pessoal, 
              comportamental, emocional e profissional.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar testes..."
                className="pl-12 h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground shadow-sozo-sm"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                  )}
                >
                  <category.icon className="w-4 h-4" />
                  {category.name}
                  <span className="text-xs opacity-70">({category.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground mb-8">
            Mostrando {filteredTests.length} testes
          </p>

          {/* Tests Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test, index) => (
              <Link
                key={test.id}
                to={`/testes/${test.id}`}
                className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-sozo-lg animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {test.popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold z-10">
                    Popular
                  </div>
                )}
                
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

          {/* Empty State */}
          {filteredTests.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">
                Nenhum teste encontrado com os filtros selecionados.
              </p>
              <Button variant="outline" onClick={() => { setActiveCategory("all"); setSearchTerm(""); }}>
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
