import { useState, useEffect } from "react";
import { Check, Loader2, ArrowRight, ExternalLink, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  target_role: string;
}

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (data) {
        setPlans(
          data.map((p) => ({
            ...p,
            features: Array.isArray(p.features) ? (p.features as string[]) : [],
            description: p.description || "",
          }))
        );
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planSlug: string) => {
    if (!user) {
      toast({ title: "Faça login", description: "Você precisa estar logado para assinar." });
      return;
    }

    setSubscribing(planSlug);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { planSlug },
      });

      if (error) throw error;

      if (data.alreadySubscribed) {
        toast({ title: "Já assinante!", description: "Sua assinatura já está ativa." });
        return;
      }

      if (data.invoiceUrl) {
        setInvoiceUrl(data.invoiceUrl);
        setShowDialog(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar assinatura";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="relative p-6 md:p-8 rounded-2xl bg-card border border-border shadow-sozo-md hover:shadow-sozo-lg transition-shadow"
          >
            {plan.slug === "enterprise" && (
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full gradient-warm text-primary-foreground text-xs font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Popular
              </div>
            )}

            <h3 className="font-heading text-2xl font-bold text-foreground mb-1">
              {plan.name}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

            <div className="mb-6">
              <span className="text-4xl font-heading font-bold text-foreground">
                R$ {plan.price.toFixed(2).replace(".", ",")}
              </span>
              <span className="text-muted-foreground text-sm">
                /{plan.interval === "yearly" ? "ano" : "mês"}
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-secondary" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              variant={plan.slug === "enterprise" ? "accent" : "default"}
              size="lg"
              className="w-full"
              onClick={() => handleSubscribe(plan.slug)}
              disabled={subscribing === plan.slug}
            >
              {subscribing === plan.slug ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  Assinar Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Finalizar Assinatura</DialogTitle>
            <DialogDescription>
              Clique no botão abaixo para abrir a página de pagamento seguro.
              Após a confirmação, sua assinatura será ativada automaticamente.
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
              Após o pagamento, sua assinatura será ativada automaticamente.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
