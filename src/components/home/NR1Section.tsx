import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Scale, Heart, CheckCircle, ArrowRight } from "lucide-react";

const nr1Requirements = [
  {
    icon: Shield,
    title: "Identificação de Riscos",
    description: "Mapeamento completo dos fatores de riscos psicossociais no ambiente de trabalho"
  },
  {
    icon: Scale,
    title: "Avaliação Quantitativa", 
    description: "Mensuração objetiva dos níveis de risco através de métodos científicos validados"
  },
  {
    icon: Heart,
    title: "Saúde Mental",
    description: "Análise do impacto dos fatores organizacionais na saúde mental dos trabalhadores"
  },
  {
    icon: CheckCircle,
    title: "Conformidade Legal",
    description: "Atendimento integral às exigências da NR1 para gestão de riscos psicossociais"
  }
];

export function NR1Section() {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            Norma Regulamentadora NR1
          </Badge>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Adequação à NR1: Riscos Psicossociais
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A nova versão da NR1 exige que as empresas identifiquem, avaliem e controlem os riscos 
            psicossociais no trabalho. O MAPSO é a ferramenta completa para garantir conformidade legal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {nr1Requirements.map((requirement, index) => (
            <Card key={index} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <requirement.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{requirement.title}</h3>
                <p className="text-sm text-muted-foreground">{requirement.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Baseado nas diretrizes do Ministério do Trabalho
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/mapso">
                Conhecer MAPSO
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/sobre">Saiba Mais sobre NR1</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}