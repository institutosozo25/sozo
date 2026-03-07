import { Check, Sparkles, ArrowRight } from "lucide-react";
import { UnlockResultButton } from "./UnlockResultButton";

interface PaywallResultProps {
  submissionId: string;
  testTitle: string;
  price: number;
  onUnlocked?: () => void;
}

export function PaywallResult({ submissionId, testTitle, price, onUnlocked }: PaywallResultProps) {
  const benefits = [
    "Análise psicológica completa",
    "Pontos fortes e fracos",
    "Perfil profissional ideal",
    "Recomendações personalizadas",
  ];

  return (
    <div className="p-6 md:p-8 rounded-2xl gradient-primary text-primary-foreground">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6" />
        <h3 className="font-heading text-xl font-bold">
          Seu relatório completo está pronto!
        </h3>
      </div>

      <p className="text-primary-foreground/80 mb-6">
        Desbloqueie agora para ver:
      </p>

      <ul className="space-y-3 mb-8">
        {benefits.map((b) => (
          <li key={b} className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3" />
            </div>
            {b}
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-primary-foreground/70">
          {testTitle} — Relatório Completo
        </p>
        <p className="text-3xl font-heading font-bold">
          R$ {price.toFixed(2).replace(".", ",")}
        </p>

        <UnlockResultButton
          submissionId={submissionId}
          onUnlocked={onUnlocked}
        />

        <p className="text-xs text-primary-foreground/50 text-center mt-2">
          Pagamento seguro via PIX ou cartão de crédito
        </p>
      </div>
    </div>
  );
}
