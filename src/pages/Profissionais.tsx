import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Briefcase, Users, CreditCard, Share2, BarChart3, Award } from "lucide-react";

const plans = [
  {
    name: "Básico",
    description: "Para profissionais iniciantes",
    price: "R$ 97",
    period: "/mês",
    features: [
      "10 aplicações de teste/mês",
      "Relatórios completos por IA",
      "Painel de pacientes",
      "Histórico de resultados",
      "Suporte por e-mail",
    ],
    cta: "Começar Agora",
    popular: false,
  },
  {
    name: "Profissional",
    description: "Para consultórios ativos",
    price: "R$ 197",
    period: "/mês",
    features: [
      "50 aplicações de teste/mês",
      "Tudo do plano Básico",
      "Link exclusivo de aplicação",
      "Marca personalizada",
      "Relatórios em PDF",
      "Suporte prioritário",
    ],
    cta: "Começar Agora",
    popular: true,
  },
  {
    name: "Clínica",
    description: "Para clínicas e equipes",
    price: "R$ 397",
    period: "/mês",
    features: [
      "Aplicações ilimitadas",
      "Tudo do plano Profissional",
      "Múltiplos profissionais",
      "Sistema de revenda",
      "Comissões sobre vendas",
      "Account manager",
    ],
    cta: "Começar Agora",
    popular: false,
  },
];

const benefits = [
  {
    icon: BarChart3,
    title: "Painel Completo",
    description: "Gerencie todos os seus pacientes e resultados em um só lugar.",
  },
  {
    icon: Share2,
    title: "Links Exclusivos",
    description: "Envie links personalizados para seus pacientes fazerem os testes.",
  },
  {
    icon: CreditCard,
    title: "Créditos Flexíveis",
    description: "Compre créditos avulsos ou escolha um plano mensal.",
  },
  {
    icon: Award,
    title: "Sistema de Revenda",
    description: "Ganhe comissões revendendo testes para outros profissionais.",
  },
];

export default function Profissionais() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-20 gradient-warm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <Briefcase className="w-4 h-4" />
              <span className="text-primary-foreground text-sm font-medium">Para Profissionais</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Potencialize seu
              <span className="block">atendimento</span>
            </h1>
            
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Ferramentas avançadas para psicólogos, coaches e terapeutas aplicarem 
              testes e acompanharem o desenvolvimento de seus pacientes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="xl" className="bg-primary-foreground text-sozo-red hover:bg-primary-foreground/90" asChild>
                <Link to="#planos">
                  Ver Planos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline-light" size="xl" asChild>
                <Link to="/contato">Falar com Consultor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recursos para profissionais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tudo que você precisa para elevar seu atendimento
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-sozo-red/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-sozo-red" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos para Profissionais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Escolha o plano ideal para o seu volume de atendimentos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl bg-card border overflow-hidden transition-all hover:shadow-sozo-lg ${
                  plan.popular ? "border-sozo-red ring-2 ring-sozo-red" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-sozo-red text-primary-foreground text-center py-2 text-sm font-semibold">
                    Mais Popular
                  </div>
                )}
                
                <div className={`p-8 ${plan.popular ? "pt-14" : ""}`}>
                  <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-sozo-red flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.popular ? "warm" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <Link to="/cadastro">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
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
