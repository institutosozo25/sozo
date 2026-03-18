import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { History, Users, CreditCard, ArrowRight, FileText, Shield } from "lucide-react";

export default function GerenciaPainel() {
  const { user, plan } = useAuth();
  const isEnterprise = plan === "enterprise";
  const [stats, setStats] = useState({ historico: 0, pessoas: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { count: histCount } = await supabase
        .from("test_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      let pessoasCount = 0;
      if (accountType === "empresa") {
        const { data: empresa } = await supabase.from("empresas").select("id").eq("profile_id", user.id).single();
        if (empresa) {
          const { count } = await supabase.from("colaboradores").select("*", { count: "exact", head: true }).eq("empresa_id", empresa.id);
          pessoasCount = count || 0;
        }
      } else {
        const { data: prof } = await supabase.from("profissionais").select("id").eq("profile_id", user.id).single();
        if (prof) {
          const { count } = await supabase.from("pacientes").select("*", { count: "exact", head: true }).eq("profissional_id", prof.id);
          pessoasCount = count || 0;
        }
      }

      setStats({ historico: histCount || 0, pessoas: pessoasCount });
    };
    fetchStats();
  }, [user, accountType]);

  const quickLinks = accountType === "empresa"
    ? [
        { icon: History, label: "Histórico de Testes", path: "/gerencia/historico", count: stats.historico },
        { icon: Users, label: "Colaboradores", path: "/gerencia/colaboradores", count: stats.pessoas },
        { icon: Shield, label: "MAPSO / NR1", path: "/gerencia/mapso" },
        { icon: CreditCard, label: "Pagamentos", path: "/gerencia/pagamentos" },
      ]
    : [
        { icon: History, label: "Histórico de Testes", path: "/gerencia/historico", count: stats.historico },
        { icon: Users, label: "Pacientes", path: "/gerencia/pacientes", count: stats.pessoas },
        { icon: CreditCard, label: "Pagamentos", path: "/gerencia/pagamentos" },
      ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Painel de Gerência</h1>
      <p className="text-muted-foreground mb-8">
        {accountType === "empresa" ? "Gerencie sua empresa, colaboradores e avaliações." : "Gerencie seus pacientes e testes aplicados."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickLinks.map((link) => (
          <Card key={link.path} className="hover:shadow-sozo-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                {"count" in link && link.count !== undefined && (
                  <span className="text-2xl font-bold text-foreground">{link.count}</span>
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{link.label}</h3>
              <Button variant="ghost" size="sm" asChild className="px-0 text-primary">
                <Link to={link.path}>
                  Acessar <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/testes">Aplicar Novo Teste</Link>
          </Button>
          {accountType === "empresa" && (
            <Button variant="outline" asChild>
              <Link to="/gerencia/mapso">Avaliação MAPSO</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/gerencia/historico">Ver Histórico</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
