import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { CheckCircle } from "lucide-react";

const passwordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(128),
  confirmPassword: z.string().max(128),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível redefinir a senha.", variant: "destructive" });
    } else {
      setDone(true);
      setTimeout(() => navigate("/auth"), 3000);
    }
    setIsSubmitting(false);
  };

  if (!isRecovery && !done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground">Link inválido ou expirado. Solicite um novo link de redefinição.</p>
            <Button className="mt-4" onClick={() => navigate("/forgot-password")}>Solicitar novo link</Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sozo-lg">
              {done ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-accent" />
                  </div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">Senha redefinida!</h1>
                  <p className="text-muted-foreground text-sm">Redirecionando para o login...</p>
                </div>
              ) : (
                <>
                  <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
                    Nova senha
                  </h1>
                  <p className="text-muted-foreground text-center mb-8 text-sm">
                    Defina sua nova senha abaixo.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nova senha</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={errors.password ? "border-destructive" : ""} />
                      {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={errors.confirmPassword ? "border-destructive" : ""} />
                      {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                    </div>
                    <Button type="submit" className="w-full" variant="hero" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : "Redefinir senha"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
