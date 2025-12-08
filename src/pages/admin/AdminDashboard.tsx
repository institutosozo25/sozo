import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Users, FileBarChart, TrendingUp } from "lucide-react";

interface Stats {
  totalTests: number;
  totalSubmissions: number;
  totalUsers: number;
  recentSubmissions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTests: 0,
    totalSubmissions: 0,
    totalUsers: 0,
    recentSubmissions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [testsRes, submissionsRes, usersRes] = await Promise.all([
        supabase.from("tests").select("id", { count: "exact", head: true }),
        supabase.from("test_submissions").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentRes = await supabase
        .from("test_submissions")
        .select("id", { count: "exact", head: true })
        .gte("started_at", weekAgo.toISOString());

      setStats({
        totalTests: testsRes.count || 0,
        totalSubmissions: submissionsRes.count || 0,
        totalUsers: usersRes.count || 0,
        recentSubmissions: recentRes.count || 0,
      });
      setIsLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total de Testes",
      value: stats.totalTests,
      icon: ClipboardList,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Submissões",
      value: stats.totalSubmissions,
      icon: FileBarChart,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Últimos 7 dias",
      value: stats.recentSubmissions,
      icon: TrendingUp,
      color: "text-sozo-green",
      bg: "bg-sozo-green/10",
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
        Dashboard
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Painel Administrativo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use o menu lateral para gerenciar testes, perguntas, relatórios e usuários do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
