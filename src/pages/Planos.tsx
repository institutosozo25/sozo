import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { SubscriptionPlans } from "@/components/payment/SubscriptionPlans";

const userPlans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "",
    description: "Para experimentar",
    features: [
      "Responda qualquer teste gratuitamente",
      "Veja seu perfil predominante",
      "Resultado parcial incluso",
    ],
    cta: "Criar Conta",
    variant: "outline" as const,
  },
  {
    name: "Individual",
    price: "Variável",
    period: "/teste",
    description: "Pague apenas pelo relatório",
    features: [
      "Responda o teste gratuitamente",
      "Relatório completo por IA",
      "PDF para download",
      "Acesso permanente ao resultado",
    ],
    cta: "Ver Testes",
    variant: "accent" as const,
    popular: true,
  },
];

export default function Planos() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Planos e Preços
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Escolha a melhor opção para sua jornada de autoconhecimento
            </p>
          </div>
        </div>
      </section>

      {/* User Plans */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Para Você
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos Individuais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Responda os testes gratuitamente e pague apenas pelo relatório completo
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {userPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl bg-card border overflow-hidden transition-all hover:shadow-sozo-lg ${
                  plan.popular ? "border-accent ring-2 ring-accent" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-center py-2 text-sm font-semibold">
                    Recomendado
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
                        <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button variant={plan.variant} className="w-full" asChild>
                    <Link to={plan.popular ? "/testes" : "/auth"}>
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

      {/* Professional & Enterprise Plans */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Para Profissionais e Empresas
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos de Assinatura
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Acesso completo para aplicar testes, gerenciar pacientes e colaboradores
            </p>
          </div>

          <SubscriptionPlans />
        </div>
      </section>

      <Footer />
    </div>
  );
}
