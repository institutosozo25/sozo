import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  History,
  Users,
  CreditCard,
  Bell,
  Building2,
  Stethoscope,
  LogOut,
  Settings,
  Shield,
  Home,
} from "lucide-react";

const enterpriseNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/gerencia" },
  { icon: History, label: "Histórico de Testes", path: "/gerencia/historico" },
  { icon: Users, label: "Colaboradores", path: "/gerencia/colaboradores" },
  { icon: Shield, label: "MAPSO / NR1", path: "/gerencia/mapso" },
  { icon: CreditCard, label: "Pagamentos", path: "/gerencia/pagamentos" },
  { icon: Bell, label: "Notificações", path: "/gerencia/notificacoes" },
  { icon: Settings, label: "Dados da Empresa", path: "/gerencia/configuracoes" },
];

const professionalNav = [
  { icon: LayoutDashboard, label: "Painel", path: "/gerencia" },
  { icon: History, label: "Histórico de Testes", path: "/gerencia/historico" },
  { icon: Users, label: "Pacientes", path: "/gerencia/pacientes" },
  { icon: CreditCard, label: "Pagamentos", path: "/gerencia/pagamentos" },
  { icon: Bell, label: "Notificações", path: "/gerencia/notificacoes" },
  { icon: Settings, label: "Meus Dados", path: "/gerencia/configuracoes" },
];

export default function GerenciaLayout() {
  const { user, isLoading, plan, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isEnterprise = plan === "enterprise";
  const isProfessional = plan === "professional";
  const hasAccess = isEnterprise || isProfessional;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    if (!isLoading && user && !hasAccess) {
      navigate("/");
    }
  }, [user, isLoading, hasAccess, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  const navItems = isEnterprise ? enterpriseNav : professionalNav;
  const Icon = isEnterprise ? Building2 : Stethoscope;
  const title = isEnterprise ? "Gerência Empresarial" : "Gerência Profissional";

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border fixed h-full flex flex-col">
        <div className="p-6">
          <Link to="/" className="block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-heading text-sm font-bold text-primary">Sozo Business</p>
                <p className="text-xs text-muted-foreground">{title}</p>
              </div>
            </div>
          </Link>
        </div>

        <nav className="px-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive =
              item.path === "/gerencia"
                ? location.pathname === "/gerencia"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/">
              <Home className="w-5 h-5 mr-3" />
              Voltar ao Site
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
