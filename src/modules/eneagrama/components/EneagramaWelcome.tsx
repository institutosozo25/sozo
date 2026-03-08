import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowRight, CheckCircle2, Shield, Clock } from "lucide-react";
import { useEneagrama } from "../contexts/EneagramaContext";
import { useState } from "react";

const EneagramaWelcome = () => {
  const { setStep, respondentName, setRespondentName, respondentEmail, setRespondentEmail } = useEneagrama();
  const [showForm, setShowForm] = useState(false);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondentName.trim() || !respondentEmail.trim()) return;
    setStep("questionnaire");
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full animate-fade-up">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Teste do Eneagrama
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Descubra seu tipo de personalidade entre os 9 perfis do Eneagrama e compreenda 
            seus padrões emocionais, motivações internas e estilo de personalidade.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="flex flex-col items-center p-4 rounded-xl bg-card border border-border text-center">
            <Clock className="h-6 w-6 text-secondary mb-2" />
            <span className="text-sm font-medium text-foreground">~25 minutos</span>
            <span className="text-xs text-muted-foreground">135 perguntas</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-card border border-border text-center">
            <CheckCircle2 className="h-6 w-6 text-accent mb-2" />
            <span className="text-sm font-medium text-foreground">Relatório Completo</span>
            <span className="text-xs text-muted-foreground">Análise profissional</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-card border border-border text-center">
            <Shield className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium text-foreground">Confidencial</span>
            <span className="text-xs text-muted-foreground">Dados protegidos</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Como funciona</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Este teste tem como objetivo ajudar você a compreender seus padrões emocionais, motivações internas e estilo de personalidade.
            Responda com sinceridade pensando em como você <strong className="text-foreground">realmente é</strong>, não como gostaria de ser.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-secondary font-bold">1.</span>
              Para cada afirmação, escolha o quanto ela se aplica a você (de Nunca a Sempre).
            </li>
            <li className="flex items-start gap-2">
              <span className="text-secondary font-bold">2.</span>
              Não existem respostas certas ou erradas.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-secondary font-bold">3.</span>
              Ao final, você receberá um relatório completo com seu tipo dominante e asa.
            </li>
          </ul>
        </div>

        {!showForm ? (
          <div className="text-center">
            <Button variant="accent" size="xl" onClick={() => setShowForm(true)}>
              Vamos Começar
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleStart} className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-fade-up">
            <h3 className="font-heading font-semibold text-foreground">Seus dados</h3>
            <div className="space-y-2">
              <Label htmlFor="enea-name">Nome completo *</Label>
              <Input
                id="enea-name"
                placeholder="Seu nome"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enea-email">E-mail *</Label>
              <Input
                id="enea-email"
                type="email"
                placeholder="seu@email.com"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
            <Button type="submit" variant="accent" className="w-full">
              Iniciar Teste
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EneagramaWelcome;
