import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
}

export default function GerenciaPagamentos() {
  const { user } = useAuth();
  const { plan, status, isActive } = useSubscription();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, status, type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setPayments(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const statusBadge = (s: string) => {
    if (s === "paid" || s === "confirmed") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3" /> Pago</span>;
    if (s === "pending") return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3" /> Pendente</span>;
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="w-3 h-3" /> {s}</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground">Gerencie seu plano e histórico de pagamentos.</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="mb-8 border-primary/30">
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-foreground capitalize">{plan || "Nenhum plano ativo"}</p>
              <p className="text-sm text-muted-foreground">
                Status: {isActive ? (
                  <span className="text-green-600 font-medium">Ativo</span>
                ) : (
                  <span className="text-amber-600 font-medium">{status || "Inativo"}</span>
                )}
              </p>
            </div>
            <Button asChild>
              <Link to="/planos">{plan ? "Alterar Plano" : "Escolher Plano"}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Últimos 20 pagamentos realizados.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum pagamento encontrado.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      R$ {p.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")} • {p.type === "subscription" ? "Assinatura" : "Avulso"}
                    </p>
                  </div>
                  {statusBadge(p.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
