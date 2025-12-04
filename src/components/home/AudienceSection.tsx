import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, Briefcase, Users, ArrowRight, Check } from "lucide-react";

const audiences = [
  {
    icon: Users,
    title: "Para Você",
    subtitle: "Usuário Individual",
    description: "Descubra seu potencial com testes personalizados e relatórios detalhados por IA.",
    features: [
      "Acesso a todos os testes",
      "Relatórios completos",
      "Histórico de resultados",
      "Recomendações personalizadas",
    ],
    cta: "Começar Gratuitamente",
    href: "/cadastro",
    gradient: "from-secondary to-sozo-blue",
  },
  {
    icon: Briefcase,
    title: "Para Profissionais",
    subtitle: "Psicólogos, Coaches e Terapeutas",
    description: "Ferramentas avançadas para aplicar testes e acompanhar seus pacientes.",
    features: [
      "Painel de gestão de pacientes",
      "Aplicação ilimitada de testes",
      "Relatórios profissionais",
      "Sistema de revenda",
    ],
    cta: "Conhecer Planos",
    href: "/profissionais",
    gradient: "from-sozo-red to-sozo-orange",
    featured: true,
  },
  {
    icon: Building2,
    title: "Para Empresas",
    subtitle: "RH e Gestão de Pessoas",
    description: "Gerencie equipes e acompanhe o desenvolvimento comportamental dos colaboradores.",
    features: [
      "Dashboard corporativo",
      "Análise de equipes",
      "Relatórios de clima",
      "Planos customizados",
    ],
    cta: "Falar com Vendas",
    href: "/empresas",
    gradient: "from-accent to-sozo-beige",
  },
];

export function AudienceSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Soluções Personalizadas
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Uma solução para cada necessidade
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Seja você um indivíduo buscando autoconhecimento, um profissional de saúde mental 
            ou uma empresa, temos a solução ideal.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <div
              key={audience.title}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-sozo-lg animate-fade-up ${
                audience.featured ? "ring-2 ring-accent" : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {audience.featured && (
                <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-center py-2 text-sm font-semibold">
                  Mais Popular
                </div>
              )}
              
              {/* Header */}
              <div className={`bg-gradient-to-br ${audience.gradient} p-8 ${audience.featured ? "pt-12" : ""}`}>
                <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <audience.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <p className="text-primary-foreground/70 text-sm mb-1">{audience.subtitle}</p>
                <h3 className="font-heading text-2xl font-bold text-primary-foreground">
                  {audience.title}
                </h3>
              </div>

              {/* Content */}
              <div className="bg-card p-8 border-x border-b border-border">
                <p className="text-muted-foreground mb-6">
                  {audience.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {audience.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-foreground">
                      <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-secondary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={audience.featured ? "accent" : "outline"} 
                  className="w-full" 
                  asChild
                >
                  <Link to={audience.href}>
                    {audience.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
