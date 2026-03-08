import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { ArrowLeft, Mail } from "lucide-react";

const emailSchema = z.string().trim().email("E-mail inválido").max(255);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      toast({ title: "Erro", description: "Ocorreu um erro ao enviar o e-mail.", variant: "destructive" });
    } else {
      setSent(true);
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
              {sent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-accent" />
                  </div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">E-mail enviado!</h1>
                  <p className="text-muted-foreground text-sm">
                    Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                  </p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link to="/auth"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao login</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
                    Esqueci minha senha
                  </h1>
                  <p className="text-muted-foreground text-center mb-8 text-sm">
                    Informe seu e-mail para receber o link de redefinição.
                  </p>
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
                        className={error ? "border-destructive" : ""}
                      />
                      {error && <p className="text-destructive text-sm">{error}</p>}
                    </div>
                    <Button type="submit" className="w-full" variant="hero" disabled={isSubmitting}>
                      {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
                    </Button>
                  </form>
                  <div className="mt-6 text-center">
                    <Link to="/auth" className="text-primary hover:underline text-sm">
                      <ArrowLeft className="w-3 h-3 inline mr-1" /> Voltar ao login
                    </Link>
                  </div>
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
