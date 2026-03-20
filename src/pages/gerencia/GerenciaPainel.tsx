import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  History, Users, CreditCard, ArrowRight, FileText,
  Brain, Sparkles, Heart, Shield, Users as UsersGroup,
} from "lucide-react";

const TEST_CARDS = [
  { slug: "disc", name: "DISC", description: "Análise Comportamental", icon: Brain, path: "/gerencia/disc", gradient: "from-blue-500 to-cyan-500" },
  { slug: "mbti", name: "MBTI", description: "Personalidade", icon: Sparkles, path: "/gerencia/mbti", gradient: "from-purple-500 to-pink-500" },
  { slug: "temperamento", name: "Temperamento", description: "Análise Profunda", icon: Heart, path: "/gerencia/temperamento", gradient: "from-orange-500 to-red-500" },
  { slug: "eneagrama", name: "Eneagrama", description: "9 Tipos", icon: UsersGroup, path: "/gerencia/eneagrama", gradient: "from-green-500 to-emerald-500" },
  { slug: "mapso", name: "MAPSO / NR1", description: "Riscos Psicossociais", icon: Shield, path: "/gerencia/mapso", gradient: "from-primary to-secondary" },
];

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
      if (isEnterprise) {
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
  }, [user, plan, isEnterprise]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Painel de Gerência</h1>
      <p className="text-muted-foreground mb-8">
        {isEnterprise ? "Gerencie sua empresa, colaboradores e avaliações." : "Gerencie seus pacientes e testes aplicados."}
      </p>

      {/* Test Cards */}
      <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Ferramentas de Avaliação</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {TEST_CARDS.map((test) => {
          const Icon = test.icon;
          return (
            <Link key={test.slug} to={test.path}>
              <Card className="hover:shadow-sozo-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                <div className={`h-1.5 bg-gradient-to-r ${test.gradient} rounded-t-lg`} />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-gradient-to-br ${test.gradient} p-2.5`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-foreground">{test.name}</h3>
                      <p className="text-xs text-muted-foreground">{test.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Visão Geral</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-sozo-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <History className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.historico}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Histórico de Testes</h3>
            <Button variant="ghost" size="sm" asChild className="px-0 text-primary">
              <Link to="/gerencia/historico">Acessar <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sozo-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.pessoas}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{isEnterprise ? "Colaboradores" : "Pacientes"}</h3>
            <Button variant="ghost" size="sm" asChild className="px-0 text-primary">
              <Link to={isEnterprise ? "/gerencia/colaboradores" : "/gerencia/pacientes"}>Acessar <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sozo-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Pagamentos</h3>
            <Button variant="ghost" size="sm" asChild className="px-0 text-primary">
              <Link to="/gerencia/pagamentos">Acessar <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
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
            <Link to="/gerencia/disc">Aplicar DISC</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/gerencia/mbti">Aplicar MBTI</Link>
          </Button>
          {isEnterprise && (
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
