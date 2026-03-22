import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Stethoscope, ArrowRight } from "lucide-react";
import { loginSchema, signupSchema } from "@/lib/validation";
import { getSistemaUrl } from "@/hooks/useAppMode";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [telefone, setTelefone] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [termosConsent, setTermosConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, plan } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      if (plan === "enterprise" || plan === "professional") {
        // Redirect enterprise/professional to sistema
        window.location.href = getSistemaUrl();
      } else {
        navigate("/dashboard/usuario");
      }
    }
  }, [user, plan, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (isLogin) {
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
        } else {
          toast({ title: "Bem-vindo de volta!" });
        }
      } else {
        const result = signupSchema.safeParse({ email, password, confirmPassword, fullName, telefone });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        if (!lgpdConsent) {
          setErrors({ lgpd: "Você deve aceitar a Política de Privacidade para continuar." });
          setIsSubmitting(false);
          return;
        }

        if (!termosConsent) {
          setErrors({ termos: "Você deve aceitar os Termos de Uso para continuar." });
          setIsSubmitting(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, "usuario", telefone);
        if (error) {
          let message = error.message;
          if (error.message.includes("already registered")) {
            message = "Este e-mail já está cadastrado";
          }
          toast({ title: "Erro ao criar conta", description: message, variant: "destructive" });
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu e-mail para confirmar o cadastro antes de fazer login.",
          });
          setIsLogin(true);
        }
      }
    } catch {
      toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sozo-lg">
              <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
                {isLogin ? "Entrar" : "Criar Conta"}
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                {isLogin ? "Acesse sua conta para continuar" : "Crie sua conta individual para acessar os testes"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" maxLength={100} className={errors.fullName ? "border-destructive" : ""} />
                    {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" maxLength={255} className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      inputMode="numeric"
                      value={telefone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        let masked = digits;
                        if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                        if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                        setTelefone(masked);
                      }}
                      placeholder="(11) 99999-0000"
                      maxLength={16}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={errors.password ? "border-destructive" : ""} />
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar senha</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={errors.confirmPassword ? "border-destructive" : ""} />
                      {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <Checkbox
                        id="lgpd-consent"
                        checked={lgpdConsent}
                        onCheckedChange={(checked) => setLgpdConsent(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="lgpd-consent" className="cursor-pointer text-xs text-muted-foreground leading-snug">
                        Declaro que li e concordo com a{" "}
                        <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>{" "}
                        e o tratamento de dados conforme a LGPD (Lei Geral de Proteção de Dados).
                      </label>
                    </div>
                    {errors.lgpd && <p className="text-destructive text-sm">{errors.lgpd}</p>}

                    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <Checkbox
                        id="termos-consent"
                        checked={termosConsent}
                        onCheckedChange={(checked) => setTermosConsent(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="termos-consent" className="cursor-pointer text-xs text-muted-foreground leading-snug">
                        Declaro que li e concordo com os{" "}
                        <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>{" "}
                        da plataforma Plenitude Sozo.
                      </label>
                    </div>
                    {errors.termos && <p className="text-destructive text-sm">{errors.termos}</p>}
                  </>
                )}

                <Button type="submit" className="w-full" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-primary hover:underline text-sm block mx-auto">
                  {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
                </button>
                {isLogin && (
                  <Link to="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline text-sm block">
                    Esqueci minha senha
                  </Link>
                )}
              </div>
            </div>

            {/* CTA for enterprise/professional */}
            <a
              href={getSistemaUrl()}
              className="flex items-center justify-between gap-3 bg-card rounded-2xl border border-border p-5 shadow-sozo hover:border-primary/50 hover:shadow-sozo-lg transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border-2 border-card">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border-2 border-card">
                    <Stethoscope className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Sou empresa ou profissional</p>
                  <p className="text-xs text-muted-foreground">Acessar o sistema de gestão</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
