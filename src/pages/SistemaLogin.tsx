import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getSalesUrl } from "@/hooks/useAppMode";
import { Building2, Stethoscope, ShieldCheck, ArrowLeft } from "lucide-react";
import { loginSchema } from "@/lib/validation";

export default function SistemaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, user, plan, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate("/admin");
      } else if (plan === "enterprise" || plan === "professional") {
        navigate("/gerencia");
      } else {
        // Individual users should go to sales site
        toast({
          title: "Acesso restrito",
          description: "Esta área é exclusiva para empresas e profissionais. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = getSalesUrl();
        }, 2000);
      }
    }
  }, [user, plan, isAdmin, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      let message = error.message;
      if (error.message === "Invalid login credentials") {
        message = "E-mail ou senha incorretos";
      } else if (error.message === "Email not confirmed") {
        message = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
      }
      toast({ title: "Erro ao entrar", description: message, variant: "destructive" });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Plenitude Sozo
          </h1>
          <p className="text-muted-foreground text-sm">
            Plataforma de Gestão — Empresas & Profissionais
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sozo-lg">
          <h2 className="font-heading text-xl font-bold text-foreground text-center mb-2">
            Acessar Sistema
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Área exclusiva para administradores, empresas e profissionais
          </p>

          {/* Role indicators */}
          <div className="flex justify-center gap-4 mb-6">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Empresas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span>Profissionais</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Admin</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                maxLength={255}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" variant="hero" disabled={isSubmitting}>
              {isSubmitting ? "Carregando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline text-sm">
              Esqueci minha senha
            </Link>
          </div>
        </div>

        {/* Back to sales site */}
        <div className="text-center">
          <a
            href={getSalesUrl()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site principal
          </a>
        </div>
      </div>
    </div>
  );
}
