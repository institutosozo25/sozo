import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UpsellProfessionalProps {
  onDismiss?: () => void;
}

export function UpsellProfessional({ onDismiss }: UpsellProfessionalProps) {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-sozo-lg">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-accent" />
        <h3 className="font-heading text-xl font-bold text-foreground">
          Você gostou do seu relatório?
        </h3>
      </div>

      <p className="text-muted-foreground mb-6">
        Com o <strong className="text-foreground">Plano Profissional</strong>, você pode aplicar
        testes em seus pacientes e gerar relatórios ilimitados.
      </p>

      <ul className="space-y-2 mb-6">
        {[
          "Testes ilimitados",
          "Gerenciar pacientes",
          "Relatórios completos para cada paciente",
          "Suporte prioritário",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-secondary flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="accent"
          size="lg"
          className="flex-1"
          onClick={() => navigate("/planos")}
        >
          Conhecer o Plano Profissional
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {onDismiss && (
          <Button variant="ghost" size="lg" onClick={onDismiss}>
            Agora não
          </Button>
        )}
      </div>
    </div>
  );
}
