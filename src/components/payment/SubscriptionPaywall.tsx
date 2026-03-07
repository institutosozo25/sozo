import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SubscriptionPaywallProps {
  title?: string;
  description?: string;
}

export function SubscriptionPaywall({
  title = "Recurso exclusivo para assinantes",
  description = "Assine um plano para desbloquear este recurso e aproveitar todos os benefícios da plataforma.",
}: SubscriptionPaywallProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary-foreground" />
      </div>
      <h2 className="font-heading text-2xl font-bold text-foreground mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-8">{description}</p>
      <Button variant="accent" size="lg" onClick={() => navigate("/planos")}>
        Ver Planos
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
