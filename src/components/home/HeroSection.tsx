import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, Heart, Users, Sparkles } from "lucide-react";
export function HeroSection() {
  return <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{
        animationDelay: "2s"
      }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 pt-32 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-primary-foreground">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6 animate-fade-up">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Conforme NR1 - Riscos Psicossociais</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-up" style={{
            animationDelay: "0.1s"
          }}>A Plataforma Mais Completa de    <span className="block text-accent"> Desenvolvimento Humano      </span>
              ​
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl animate-fade-up" style={{
            animationDelay: "0.2s"
          }}>
              Descubra seu perfil comportamental, emocional, espiritual e profissional com testes científicos e relatórios detalhados. 
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{
            animationDelay: "0.3s"
          }}>
              <Button variant="accent" size="xl" asChild>
                <Link to="/testes">
                  Começar Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline-light" size="xl" asChild>
                <Link to="/sobre">Conhecer Mais</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-primary-foreground/10 animate-fade-up" style={{
            animationDelay: "0.4s"
          }}>
              <div>
                <p className="font-heading text-3xl md:text-4xl font-bold text-accent">50+</p>
                <p className="text-primary-foreground/70 text-sm">Testes Disponíveis</p>
              </div>
              <div>
                <p className="font-heading text-3xl md:text-4xl font-bold text-accent">10k+</p>
                <p className="text-primary-foreground/70 text-sm">Usuários Ativos</p>
              </div>
              <div>
                <p className="font-heading text-3xl md:text-4xl font-bold text-accent">98%</p>
                <p className="text-primary-foreground/70 text-sm">Satisfação</p>
              </div>
            </div>
          </div>

          {/* Visual Elements */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Central Circle */}
              <div className="absolute inset-0 m-auto w-48 h-48 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center animate-pulse-glow">
                <div className="w-32 h-32 rounded-full gradient-warm flex items-center justify-center">
                  <Brain className="w-16 h-16 text-primary-foreground" />
                </div>
              </div>

              {/* Orbiting Elements */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center animate-float">
                <Heart className="w-10 h-10 text-sozo-red" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center animate-float" style={{
              animationDelay: "1s"
            }}>
                <Users className="w-10 h-10 text-accent" />
              </div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center animate-float" style={{
              animationDelay: "2s"
            }}>
                <Sparkles className="w-10 h-10 text-sozo-beige" />
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center animate-float" style={{
              animationDelay: "3s"
            }}>
                <Brain className="w-10 h-10 text-secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>;
}