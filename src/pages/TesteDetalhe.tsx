import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Users, BarChart3, ArrowRight, Check, Brain, FileText, Sparkles } from "lucide-react";

const testsData: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  duration: string;
  questions: number;
  category: string;
  gradient: string;
  icon: typeof Brain;
  benefits: string[];
  whoFor: string[];
  reportPreview: string[];
}> = {
  disc: {
    title: "Teste DISC",
    subtitle: "Perfil Comportamental",
    description: "Descubra seu perfil comportamental predominante e como você se relaciona com o mundo.",
    longDescription: "O modelo DISC é uma metodologia cientificamente validada que identifica quatro perfis comportamentais: Dominância (D), Influência (I), Estabilidade (S) e Conformidade (C). Este teste ajuda você a entender suas tendências naturais de comportamento, comunicação e tomada de decisão.",
    duration: "15 min",
    questions: 28,
    category: "Comportamental",
    gradient: "from-sozo-blue to-secondary",
    icon: Brain,
    benefits: [
      "Autoconhecimento profundo",
      "Melhoria na comunicação",
      "Relacionamentos mais saudáveis",
      "Desenvolvimento de carreira",
      "Gestão de conflitos",
    ],
    whoFor: [
      "Profissionais em transição de carreira",
      "Líderes e gestores",
      "Equipes de trabalho",
      "Casais e famílias",
      "Estudantes e recém-formados",
    ],
    reportPreview: [
      "Seu perfil DISC detalhado",
      "Pontos fortes e áreas de desenvolvimento",
      "Estilo de comunicação",
      "Como você lida com conflitos",
      "Recomendações para carreira",
      "Dicas para relacionamentos",
    ],
  },
  mbti: {
    title: "Teste de Personalidade MBTI",
    subtitle: "16 Tipos de Personalidade",
    description: "Descubra seu tipo psicológico e suas preferências naturais de comportamento.",
    longDescription: "O MBTI (Myers-Briggs Type Indicator) é uma das ferramentas mais utilizadas no mundo para identificação de tipos psicológicos. Baseado na teoria de Carl Jung, identifica preferências em quatro dimensões: Energia (E/I), Percepção (S/N), Decisão (T/F) e Estilo de Vida (J/P), gerando 16 tipos de personalidade possíveis.",
    duration: "20 min",
    questions: 70,
    category: "Personalidade",
    gradient: "from-secondary to-sozo-blue",
    icon: Brain,
    benefits: [
      "Autoconhecimento profundo",
      "Clareza sobre seus talentos naturais",
      "Melhoria na comunicação",
      "Orientação de carreira",
      "Desenvolvimento pessoal",
    ],
    whoFor: [
      "Profissionais em busca de direção",
      "Líderes e gestores",
      "Estudantes e recém-formados",
      "Casais e famílias",
      "Qualquer pessoa buscando autoconhecimento",
    ],
    reportPreview: [
      "Seu tipo entre os 16 perfis MBTI",
      "Pontos fortes e desafios",
      "Comunicação e relacionamentos",
      "20 profissões compatíveis",
      "Estilo de liderança",
      "Plano de desenvolvimento pessoal",
    ],
  },
  "inteligencia-emocional": {
    title: "Inteligência Emocional",
    subtitle: "QE - Quociente Emocional",
    description: "Avalie sua capacidade de reconhecer e gerenciar emoções.",
    longDescription: "A Inteligência Emocional (QE) é a capacidade de identificar, compreender e gerenciar suas próprias emoções, bem como reconhecer e influenciar as emoções dos outros. Este teste avalia as cinco competências principais: autoconsciência, autorregulação, motivação, empatia e habilidades sociais.",
    duration: "12 min",
    questions: 24,
    category: "Emocional",
    gradient: "from-sozo-red to-sozo-orange",
    icon: Brain,
    benefits: [
      "Maior autoconsciência",
      "Melhor gestão do estresse",
      "Relacionamentos mais profundos",
      "Liderança mais efetiva",
      "Bem-estar mental",
    ],
    whoFor: [
      "Líderes e gestores",
      "Profissionais de atendimento",
      "Educadores",
      "Pais e cuidadores",
      "Qualquer pessoa buscando crescimento pessoal",
    ],
    reportPreview: [
      "Seu score de QE geral",
      "Análise das 5 competências",
      "Pontos fortes emocionais",
      "Áreas de desenvolvimento",
      "Exercícios práticos",
      "Plano de desenvolvimento pessoal",
    ],
  },
};

export default function TesteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nome: "", email: "" });

  const test = testsData[id || ""] || testsData.disc;

  const handleStartTest = () => {
    if (id === "disc") {
      navigate("/testes/disc/aplicar");
      return;
    }
    if (id === "mbti") {
      navigate("/testes/mbti/aplicar");
      return;
    }
    setShowModal(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    // Here would integrate with backend to start the test
    console.log("Starting test for:", formData);
    setShowModal(false);
    // Navigate to test page
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className={`pt-32 pb-20 bg-gradient-to-br ${test.gradient}`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <span className="text-primary-foreground text-sm font-medium">{test.category}</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
              {test.title}
            </h1>
            <p className="text-primary-foreground/90 text-xl mb-2">{test.subtitle}</p>
            <p className="text-primary-foreground/70 text-lg max-w-2xl mb-8">
              {test.description}
            </p>

            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Clock className="w-5 h-5" />
                <span>{test.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <FileText className="w-5 h-5" />
                <span>{test.questions} perguntas</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <Sparkles className="w-5 h-5" />
                <span>Relatório Completo</span>
              </div>
            </div>

            <Button variant="accent" size="xl" onClick={handleStartTest}>
              Fazer Teste Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* About */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Sobre o Teste
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {test.longDescription}
                </p>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                  Benefícios
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {test.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                      <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-secondary" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Who For */}
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                  Para Quem é Indicado
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {test.whoFor.map((who) => (
                    <div key={who} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-foreground">{who}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Report Preview */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground">Prévia do Relatório</h3>
                    <p className="text-muted-foreground text-sm">Relatório Completo</p>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {test.reportPreview.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                      <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Card */}
              <div className="p-6 rounded-2xl gradient-primary text-primary-foreground">
                <h3 className="font-heading text-xl font-bold mb-2">Pronto para começar?</h3>
                <p className="text-primary-foreground/80 text-sm mb-6">
                  Faça o teste agora e receba seu relatório completo em minutos.
                </p>
                <Button variant="accent" className="w-full" onClick={handleStartTest}>
                  Iniciar Teste
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Validation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Antes de começar</DialogTitle>
            <DialogDescription>
              Preencha seus dados para iniciar o teste e receber o relatório por e-mail.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitForm} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                placeholder="Seu nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
            <Button type="submit" className="w-full" variant="accent">
              Começar Teste
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
