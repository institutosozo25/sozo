import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { Building2, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountType = "empresa" | "profissional" | "usuario";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  confirmPassword: z.string(),
  telefone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const accountTypes: { value: AccountType; label: string; description: string; icon: typeof Building2 }[] = [
  { value: "empresa", label: "Empresa", description: "Gerencie colaboradores e clima organizacional", icon: Building2 },
  { value: "profissional", label: "Profissional", description: "Gerencie pacientes e aplique testes", icon: Stethoscope },
  { value: "usuario", label: "Usuário", description: "Acesse testes e resultados pessoais", icon: User },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [telefone, setTelefone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("usuario");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user, accountType: userAccountType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && userAccountType) {
      const redirectMap: Record<string, string> = {
        empresa: "/dashboard/empresa",
        profissional: "/dashboard/profissional",
        usuario: "/dashboard/usuario",
      };
      navigate(redirectMap[userAccountType] || "/");
    } else if (user) {
      navigate("/");
    }
  }, [user, userAccountType, navigate]);

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
          toast({
            title: "Erro ao entrar",
            description: message,
            variant: "destructive",
          });
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

        const { error } = await signUp(email, password, fullName, accountType, telefone);
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
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sozo-lg">
              <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
                {isLogin ? "Entrar" : "Criar Conta"}
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                {isLogin ? "Acesse sua conta para continuar" : "Preencha seus dados para criar sua conta"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    {/* Account Type Selector */}
                    <div className="space-y-2">
                      <Label>Tipo de conta</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {accountTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setAccountType(type.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center",
                              accountType === type.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-muted-foreground text-muted-foreground"
                            )}
                          >
                            <type.icon className="w-5 h-5" />
                            <span className="text-xs font-semibold">{type.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {accountTypes.find(t => t.value === accountType)?.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome completo</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" className={errors.fullName ? "border-destructive" : ""} />
                      {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-0000" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={errors.password ? "border-destructive" : ""} />
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={errors.confirmPassword ? "border-destructive" : ""} />
                    {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                  </div>
                )}

                <Button type="submit" className="w-full" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-primary hover:underline text-sm">
                  {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
