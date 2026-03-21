import { CheckCircle2 } from "lucide-react";

const ManagedTestDone = () => {
  const completionDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4">
      <div className="max-w-md text-center animate-fade-up">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h1 className="mb-2 text-2xl font-bold text-foreground font-heading">Obrigado!</h1>
        <p className="text-muted-foreground mb-4">
          Suas respostas foram registradas com sucesso. Os resultados serão analisados pelo profissional responsável.
        </p>
        <p className="text-xs text-muted-foreground">Registrado em: {completionDate}</p>
      </div>
    </div>
  );
};

export default ManagedTestDone;
