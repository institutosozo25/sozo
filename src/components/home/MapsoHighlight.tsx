import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowRight, BarChart3, Activity, FileText } from "lucide-react";

export function MapsoHighlight() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <Link
          to="/mapso"
          className="group relative block overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-8 md:p-12 shadow-lg hover:shadow-xl transition-all duration-500 hover:border-primary/60"
        >
          {/* Badge */}
          <Badge className="absolute top-6 right-6 bg-accent text-accent-foreground text-xs font-bold px-3 py-1">
            Destaque
          </Badge>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                MAPSO
              </h2>
              <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
                Ferramenta de diagnóstico social e saúde emocional para empresas. Avaliação psicométrica completa com 64 itens em 8 dimensões baseadas em modelos científicos validados.
              </p>

              {/* Features mini */}
              <div className="flex flex-wrap gap-4 mb-6">
                {[
                  { icon: BarChart3, text: "Índice de Risco 0–100" },
                  { icon: FileText, text: "Relatório Executivo" },
                  { icon: Activity, text: "8 Dimensões" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <f.icon className="w-4 h-4 text-primary" />
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="gap-2 group-hover:gap-3 transition-all">
                Acessar MAPSO
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
