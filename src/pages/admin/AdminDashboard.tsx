import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Users, FileBarChart, TrendingUp, Bell, Building2, Briefcase, UserCircle } from "lucide-react";

interface Stats {
  totalTests: number;
  totalSubmissions: number;
  totalUsers: number;
  recentSubmissions: number;
  totalReports: number;
  totalWaitlist: number;
  usersByRole: { companies: number; professionals: number; regularUsers: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTests: 0,
    totalSubmissions: 0,
    totalUsers: 0,
    recentSubmissions: 0,
    totalReports: 0,
    totalWaitlist: 0,
    usersByRole: { companies: 0, professionals: 0, regularUsers: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [testsRes, submissionsRes, usersRes, reportsRes, waitlistRes, rolesRes] = await Promise.all([
        supabase.from("tests").select("id", { count: "exact", head: true }),
        supabase.from("test_submissions").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("generated_reports").select("id", { count: "exact", head: true }),
        supabase.from("waitlist").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
      ]);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentRes = await supabase
        .from("test_submissions")
        .select("id", { count: "exact", head: true })
        .gte("started_at", weekAgo.toISOString());

      // Count users by plan instead of role
      const profilesData = usersRes.data as any[] || [];
      // We need a separate query to count by plan
      const planRes = await supabase.from("profiles").select("subscription_plan");
      const plans = planRes.data || [];
      const companies = plans.filter((p: any) => p.subscription_plan === "enterprise").length;
      const professionals = plans.filter((p: any) => p.subscription_plan === "professional").length;
      const regularUsers = plans.filter((p: any) => !p.subscription_plan || p.subscription_plan === "free" || p.subscription_plan === "individual").length;

      setStats({
        totalTests: testsRes.count || 0,
        totalSubmissions: submissionsRes.count || 0,
        totalUsers: usersRes.count || 0,
        recentSubmissions: recentRes.count || 0,
        totalReports: reportsRes.count || 0,
        totalWaitlist: waitlistRes.count || 0,
        usersByRole: { companies, professionals, regularUsers },
      });
      setIsLoading(false);
    }

    fetchStats();
  }, []);

  const mainCards = [
    { title: "Total de Usuários", value: stats.totalUsers, icon: Users, color: "text-accent", bg: "bg-accent/10" },
    { title: "Relatórios Gerados", value: stats.totalReports, icon: FileBarChart, color: "text-secondary", bg: "bg-secondary/10" },
    { title: "Submissões", value: stats.totalSubmissions, icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
    { title: "Últimos 7 dias", value: stats.recentSubmissions, icon: TrendingUp, color: "text-sozo-green", bg: "bg-sozo-green/10" },
  ];

  const segmentCards = [
    { title: "Empresas", value: stats.usersByRole.companies, icon: Building2, color: "text-accent", bg: "bg-accent/10" },
    { title: "Profissionais", value: stats.usersByRole.professionals, icon: Briefcase, color: "text-secondary", bg: "bg-secondary/10" },
    { title: "Usuários Comuns", value: stats.usersByRole.regularUsers, icon: UserCircle, color: "text-primary", bg: "bg-primary/10" },
    { title: "Waitlist", value: stats.totalWaitlist, icon: Bell, color: "text-sozo-orange", bg: "bg-sozo-orange/10" },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mainCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{isLoading ? "..." : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Segmentação por Perfil</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {segmentCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{isLoading ? "..." : card.value}</div>
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
            Use o menu lateral para gerenciar testes, perguntas, relatórios, usuários e visualizar logs de auditoria.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
