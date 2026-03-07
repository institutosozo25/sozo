import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface UnlockResultButtonProps {
  submissionId: string;
  onUnlocked?: () => void;
}

export function UnlockResultButton({ submissionId, onUnlocked }: UnlockResultButtonProps) {
  const [loading, setLoading] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { submissionId },
      });

      if (error) throw error;

      if (data.alreadyPaid) {
        toast({ title: "Relatório já desbloqueado!", description: "Atualizando..." });
        onUnlocked?.();
        return;
      }

      if (data.invoiceUrl) {
        setInvoiceUrl(data.invoiceUrl);
        setShowDialog(true);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o link de pagamento.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="accent"
        size="xl"
        className="w-full max-w-sm"
        onClick={handleUnlock}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Processando...
          </>
        ) : (
          <>
            VER MEU RELATÓRIO COMPLETO
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Finalizar Pagamento</DialogTitle>
            <DialogDescription>
              Clique no botão abaixo para abrir a página de pagamento seguro. Após a confirmação, 
              seu relatório será desbloqueado automaticamente.
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
            <p className="text-xs text-muted-foreground text-center">
              Após o pagamento, recarregue esta página para ver o relatório completo.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
