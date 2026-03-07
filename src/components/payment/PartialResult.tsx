import { Lock, BarChart3, Brain, Target, Lightbulb } from "lucide-react";

interface PartialResultProps {
  mainProfile: string;
  mainDescription: string;
  testTitle: string;
}

export function PartialResult({ mainProfile, mainDescription, testTitle }: PartialResultProps) {
  const blockedItems = [
    { icon: BarChart3, label: "Análise psicológica completa" },
    { icon: Brain, label: "Pontos fortes e fracos" },
    { icon: Target, label: "Perfil profissional ideal" },
    { icon: Lightbulb, label: "Recomendações personalizadas" },
  ];

  return (
    <div className="space-y-6">
      {/* Visible result: main profile */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="font-heading text-lg font-bold text-foreground mb-1">
          Seu perfil predominante
        </h3>
        <p className="text-3xl font-heading font-bold text-gradient mb-3">{mainProfile}</p>
        <p className="text-muted-foreground leading-relaxed">{mainDescription}</p>
      </div>

      {/* Blocked sections with blur */}
      <div className="relative">
        <div className="space-y-4 blur-sm pointer-events-none select-none" aria-hidden>
          {blockedItems.map(({ icon: Icon, label }) => (
            <div key={label} className="p-5 rounded-xl bg-muted/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit...
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/90 backdrop-blur-sm border border-border shadow-sozo-lg">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <p className="font-heading font-bold text-foreground text-center">
              Conteúdo bloqueado
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-[240px]">
              Desbloqueie para ver o relatório completo do {testTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
