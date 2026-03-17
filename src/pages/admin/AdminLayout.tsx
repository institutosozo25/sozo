import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  ClipboardList,
  FileBarChart,
  ScrollText,
  Megaphone,
  Brain,
  CreditCard,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Brain, label: "MAPSO / NR1", path: "/admin/mapso" },
  { icon: ClipboardList, label: "Testes", path: "/admin/testes" },
  { icon: FileText, label: "Perguntas", path: "/admin/perguntas" },
  { icon: FileBarChart, label: "Relatórios", path: "/admin/relatorios" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
  { icon: ScrollText, label: "Auditoria", path: "/admin/auditoria" },
  { icon: Megaphone, label: "Notificações", path: "/admin/notificacoes" },
  { icon: Settings, label: "Configurações", path: "/admin/config" },
];

export default function AdminLayout() {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    // Non-admins stay on page but see 403
  }, [user, isLoading, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="font-heading text-3xl font-bold text-foreground">403 — Acesso Negado</h1>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border fixed h-full">
        <div className="p-6">
          <Link to="/" className="block">
            <h1 className="font-heading text-xl font-bold text-primary">
              Plenitude Sozo
            </h1>
            <p className="text-xs text-muted-foreground">Painel Administrativo</p>
          </Link>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
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
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
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
