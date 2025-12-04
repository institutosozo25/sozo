import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 gradient-hero relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-primary-foreground text-sm font-medium">
              Comece sua jornada hoje
            </span>
          </div>

          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Pronto para descobrir seu
            <span className="block text-accent">verdadeiro potencial?</span>
          </h2>

          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Faça seu primeiro teste gratuitamente e receba um relatório completo 
            com análises profundas e recomendações personalizadas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="xl" asChild>
              <Link to="/cadastro">
                Criar Conta Gratuita
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline-light" size="xl" asChild>
              <Link to="/testes">Explorar Testes</Link>
            </Button>
          </div>

          <p className="text-primary-foreground/60 text-sm mt-6">
            Não é necessário cartão de crédito. Teste grátis por 7 dias.
          </p>
        </div>
      </div>
    </section>
  );
}
