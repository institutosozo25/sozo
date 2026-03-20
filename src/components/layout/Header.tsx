import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logoSozo from "@/assets/logo-sozo.png";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, LogOut, Settings, LayoutDashboard, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";

const navigation = [
  { name: "Início", href: "/" },
  { name: "MAPSO", href: "/mapso", highlight: true },
  { name: "NR1", href: "/nr1", important: true },
  { name: "Testes", href: "/testes" },
  { name: "Para Profissionais", href: "/profissionais" },
  { name: "Para Empresas", href: "/empresas" },
  { name: "Planos", href: "/planos" },
  { name: "Contato", href: "/contato" },
  { name: "Sobre", href: "/sobre" },
];

function getDashboardPath(plan: string | null, isAdmin: boolean): string {
  if (isAdmin) return "/admin";
  if (plan === "enterprise" || plan === "professional") return "/gerencia";
  return "/dashboard/usuario";
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, plan, signOut } = useAuth();

  const dashboardPath = getDashboardPath(plan, isAdmin);
  const showGerencia = plan === "enterprise" || plan === "professional";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src={logoSozo} alt="SOZO Business - Instituto Plenitude" className="h-14 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-colors",
                  location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href))
                    ? "bg-primary/10 text-primary font-semibold"
                    : (item as any).highlight
                    ? "text-primary font-bold hover:bg-primary/5"
                    : (item as any).important
                    ? "text-red-600 font-semibold hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
                    : "text-muted-foreground font-medium hover:text-foreground hover:bg-muted"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin">
                      <Settings className="w-4 h-4 mr-2" />Admin
                    </Link>
                  </Button>
                )}
                {showGerencia && (
                  <Button variant="default" size="sm" asChild>
                    <Link to="/gerencia">
                      <Briefcase className="w-4 h-4 mr-2" />Gerência
                    </Link>
                  </Button>
                )}
                {!isAdmin && !showGerencia && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/dashboard/usuario">
                      <LayoutDashboard className="w-4 h-4 mr-2" />Minha Conta
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/auth">Começar Agora</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-up">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-border">
                {user ? (
                  <>
                    {isAdmin && (
                      <Button variant="outline" asChild>
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          <Settings className="w-4 h-4 mr-2" />Admin
                        </Link>
                      </Button>
                    )}
                    {showGerencia && (
                      <Button variant="default" asChild>
                        <Link to="/gerencia" onClick={() => setIsOpen(false)}>
                          <Briefcase className="w-4 h-4 mr-2" />Gerência
                        </Link>
                      </Button>
                    )}
                    {!isAdmin && !showGerencia && (
                      <Button variant="outline" asChild>
                        <Link to="/dashboard/usuario" onClick={() => setIsOpen(false)}>
                          <LayoutDashboard className="w-4 h-4 mr-2" />Minha Conta
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => { signOut(); setIsOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar
                      </Link>
                    </Button>
                    <Button variant="default" asChild>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>Começar Agora</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
