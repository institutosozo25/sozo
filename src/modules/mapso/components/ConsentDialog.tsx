import { useState } from "react";
import { Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const guidelines = [
  "Responda com sinceridade — não existem respostas certas ou erradas.",
  "Garanta um ambiente tranquilo e sem interrupções para responder.",
  "Suas respostas são anônimas e confidenciais.",
  "O objetivo é a melhoria organizacional e o bem-estar dos colaboradores.",
  "Os dados serão utilizados exclusivamente para fins de diagnóstico psicossocial conforme a NR1.",
];

const ConsentDialog = ({ open, onAccept, onCancel }: ConsentDialogProps) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto mb-2 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
            <Shield className="h-8 w-8" />
          </div>
          <DialogTitle className="text-center text-xl font-heading">
            Boas Práticas de Participação
          </DialogTitle>
          <DialogDescription className="text-center">
            Leia atentamente as orientações antes de iniciar o diagnóstico psicossocial MAPSO.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {guidelines.map((text, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-foreground">{text}</p>
            </div>
          ))}

          <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs text-muted-foreground">
                Este diagnóstico está em conformidade com a NR1 (Norma Regulamentadora nº 1) 
                e será utilizado para avaliação de riscos psicossociais no ambiente de trabalho.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <Checkbox
            id="consent"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor="consent" className="cursor-pointer text-sm font-medium text-foreground leading-snug">
            Estou ciente das orientações e concordo em iniciar o diagnóstico psicossocial.
          </label>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={onAccept}
            disabled={!accepted}
            className="w-full gap-2 sm:w-auto"
          >
            <Shield className="h-4 w-4" />
            Iniciar Teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentDialog;
