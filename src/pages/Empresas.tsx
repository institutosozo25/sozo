import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Building2, Users, BarChart3, Shield, Headphones } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Para pequenas empresas",
    price: "R$ 497",
    period: "/mês",
    employees: "Até 20 colaboradores",
    features: [
      "Acesso a todos os testes",
      "Relatórios individuais por IA",
      "Dashboard básico",
      "Suporte por e-mail",
      "1 administrador",
    ],
    cta: "Começar Agora",
    popular: false,
  },
  {
    name: "Growth",
    description: "Para empresas em crescimento",
    price: "R$ 997",
    period: "/mês",
    employees: "Até 100 colaboradores",
    features: [
      "Tudo do plano Starter",
      "Relatórios de equipe",
      "Análise de clima organizacional",
      "Dashboard avançado",
      "Suporte prioritário",
      "5 administradores",
      "API de integração",
    ],
    cta: "Começar Agora",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Para grandes corporações",
    price: "Personalizado",
    period: "",
    employees: "Colaboradores ilimitados",
    features: [
      "Tudo do plano Growth",
      "Account manager dedicado",
      "Treinamento presencial",
      "Customização de relatórios",
      "SLA garantido",
      "Integração com RH",
      "White label disponível",
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
];

const benefits = [
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    description: "Visualize o perfil comportamental de toda a equipe em tempo real.",
  },
  {
    icon: Users,
    title: "Gestão de Equipes",
    description: "Crie grupos, departamentos e acompanhe a evolução dos colaboradores.",
  },
  {
    icon: Shield,
    title: "Segurança de Dados",
    description: "LGPD compliant. Seus dados corporativos protegidos com criptografia.",
  },
  {
    icon: Headphones,
    title: "Suporte Especializado",
    description: "Equipe de psicólogos organizacionais para interpretar resultados.",
  },
];

export default function Empresas() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <Building2 className="w-4 h-4 text-accent" />
              <span className="text-primary-foreground text-sm font-medium">Para Empresas</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Desenvolva sua equipe com
              <span className="block text-accent">inteligência comportamental</span>
            </h1>
            
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Ferramentas avançadas para gestão de pessoas, análise de clima organizacional 
              e desenvolvimento de equipes de alta performance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="xl" asChild>
                <Link to="#planos">
                  Ver Planos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline-light" size="xl" asChild>
                <Link to="/contato">Agendar Demo</Link>
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
              Tudo que sua empresa precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas completas para RH e gestão de pessoas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-secondary" />
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
              Planos Corporativos
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho da sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl bg-card border overflow-hidden transition-all hover:shadow-sozo-lg ${
                  plan.popular ? "border-accent ring-2 ring-accent" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-center py-2 text-sm font-semibold">
                    Mais Popular
                  </div>
                )}
                
                <div className={`p-8 ${plan.popular ? "pt-14" : ""}`}>
                  <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-2">
                    <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-secondary font-medium text-sm mb-6">{plan.employees}</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.popular ? "accent" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <Link to="/contato">
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
