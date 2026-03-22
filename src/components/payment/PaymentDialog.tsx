import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Loader2 } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceUrl: string | null;
  onCheckPayment: () => void;
  isChecking: boolean;
}

export function PaymentDialog({ open, onOpenChange, invoiceUrl, onCheckPayment, isChecking }: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Finalizar Pagamento</DialogTitle>
          <DialogDescription>
            Clique no botão abaixo para abrir a página de pagamento seguro.
            Após a confirmação, seu relatório será desbloqueado automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={() => {
              if (invoiceUrl) window.open(invoiceUrl, "_blank");
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ir para Pagamento
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onCheckPayment}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Já paguei — Verificar
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Pagamentos via Pix são confirmados em segundos. Boleto pode levar até 2 dias úteis.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
