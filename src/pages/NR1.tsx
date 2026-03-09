import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Scale, 
  Heart, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users,
  ArrowRight,
  Calendar,
  BookOpen,
  Target
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const nr1Requirements = [
  {
    icon: Shield,
    title: "Identificação de Riscos Psicossociais",
    description: "Mapeamento sistemático de todos os fatores de risco psicossocial presentes no ambiente organizacional"
  },
  {
    icon: Scale,
    title: "Avaliação Quantitativa e Qualitativa",
    description: "Mensuração objetiva dos níveis de exposição aos riscos através de instrumentos científicos validados"
  },
  {
    icon: Heart,
    title: "Análise de Impactos na Saúde Mental",
    description: "Avaliação dos efeitos dos fatores organizacionais no bem-estar psicológico dos trabalhadores"
  },
  {
    icon: FileText,
    title: "Documentação e Registro",
    description: "Elaboração de relatórios técnicos e manutenção de registros atualizados das avaliações"
  },
  {
    icon: Users,
    title: "Participação dos Trabalhadores",
    description: "Envolvimento ativo dos colaboradores no processo de identificação e avaliação dos riscos"
  },
  {
    icon: Target,
    title: "Medidas de Controle",
    description: "Implementação de ações preventivas e corretivas baseadas nos resultados das avaliações"
  }
];

const timeline = [
  {
    date: "2022",
    title: "Publicação da Nova NR1",
    description: "Ministério do Trabalho publica a versão revisada da NR1 incluindo riscos psicossociais"
  },
  {
    date: "2024",
    title: "Período de Adaptação",
    description: "Empresas devem iniciar o processo de adequação às novas exigências"
  },
  {
    date: "2025",
    title: "Implementação Obrigatória",
    description: "Fiscalização intensificada e aplicação de penalidades por não conformidade"
  }
];

const consequences = [
  {
    type: "Multas Administrativas",
    range: "R$ 1.000 a R$ 100.000",
    description: "Aplicadas pelos Auditores-Fiscais do Trabalho conforme porte da empresa"
  },
  {
    type: "Interdição de Atividades",
    range: "Suspensão total ou parcial",
    description: "Paralisação das operações até regularização das não conformidades"
  },
  {
    type: "Responsabilização Civil e Criminal",
    range: "Indenizações e processos",
    description: "Ações judiciais por danos morais e materiais aos trabalhadores"
  }
];

const NR1 = () => {
  return (
    <>
      <Helmet>
        <title>NR1 - Norma Regulamentadora de Riscos Psicossociais | Instituto Plenitude Sozo</title>
        <meta name="description" content="Entenda tudo sobre a nova NR1 e os requisitos para gestão de riscos psicossociais no trabalho. O MAPSO é sua ferramenta completa para conformidade legal." />
      </Helmet>
      
      <div className="min-h-screen">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center max-w-4xl mx-auto">
                <Badge className="mb-6 bg-red-600 text-white px-6 py-3 text-base font-semibold">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Obrigatório para Todas as Empresas
                </Badge>
                
                <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6">
                  NR1: Gestão de Riscos <span className="text-primary">Psicossociais</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  A nova versão da Norma Regulamentadora NR1 estabelece a obrigatoriedade de 
                  identificar, avaliar e controlar os riscos psicossociais no ambiente de trabalho. 
                  <strong className="text-foreground"> Não conformidade resulta em multas de até R$ 100.000.</strong>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link to="/mapso">
                      Conhecer Ferramenta MAPSO
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/empresas">Solicitar Consultoria</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* O que é a NR1 */}
          <section className="py-16">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <Badge className="mb-4 bg-primary/10 text-primary px-4 py-2">
                    Definição Legal
                  </Badge>
                  <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
                    O que é a NR1?
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      A <strong className="text-foreground">Norma Regulamentadora NR1</strong> estabelece as 
                      diretrizes gerais para a gestão de riscos ocupacionais, incluindo agora 
                      os <strong className="text-foreground">riscos psicossociais</strong>.
                    </p>
                    <p>
                      Publicada pelo Ministério do Trabalho e Emprego, a norma exige que todas as 
                      organizações implementem um sistema estruturado de identificação, avaliação 
                      e controle dos fatores que podem impactar a saúde mental dos trabalhadores.
                    </p>
                    <p>
                      <strong className="text-foreground">Riscos psicossociais</strong> incluem: sobrecarga de trabalho, 
                      falta de autonomia, conflitos interpessoais, insegurança no emprego, 
                      desequilíbrio entre esforço e recompensa, e ambiente organizacional tóxico.
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-8 rounded-xl">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Base Legal</h3>
                        <p className="text-sm text-muted-foreground">Portaria SEPRT nº 6.730/2020</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Aplicação</h3>
                        <p className="text-sm text-muted-foreground">Todas as empresas com empregados</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Vigência</h3>
                        <p className="text-sm text-muted-foreground">Obrigatório desde 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Requisitos */}
          <section className="py-16 bg-muted/50">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Requisitos da NR1
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  A norma estabelece seis pilares fundamentais que toda empresa deve implementar 
                  para garantir a gestão adequada dos riscos psicossociais.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nr1Requirements.map((requirement, index) => (
                  <Card key={index} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <requirement.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{requirement.title}</h3>
                      <p className="text-sm text-muted-foreground">{requirement.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="py-16">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Cronograma de Implementação
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Entenda as etapas e prazos estabelecidos para adequação à nova NR1.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block"></div>
                  
                  <div className="space-y-8">
                    {timeline.map((item, index) => (
                      <div key={index} className="relative flex items-start gap-6">
                        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {item.date}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
                          <p className="text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Consequências */}
          <section className="py-16 bg-red-50 dark:bg-red-950/20">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-12">
                <Badge className="mb-4 bg-red-600 text-white px-4 py-2">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Atenção
                </Badge>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Consequências da Não Conformidade
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  As penalidades por não atendimento à NR1 são severas e podem impactar 
                  significativamente as operações da empresa.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {consequences.map((consequence, index) => (
                  <Card key={index} className="border-red-200 dark:border-red-800">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-foreground mb-2">{consequence.type}</h3>
                        <div className="text-2xl font-bold text-red-600 mb-2">{consequence.range}</div>
                        <p className="text-sm text-muted-foreground">{consequence.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  <strong className="text-foreground">Importante:</strong> Além das penalidades administrativas, 
                  empresas podem enfrentar ações trabalhistas por danos morais e materiais, 
                  aumentando significativamente os custos da não conformidade.
                </p>
              </div>
            </div>
          </section>

          {/* MAPSO Solution */}
          <section className="py-16 bg-primary/5">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <Badge className="mb-6 bg-primary text-primary-foreground px-6 py-3 text-base font-semibold">
                  Solução Completa
                </Badge>
                
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">
                  MAPSO: Sua Ferramenta de Adequação à NR1
                </h2>
                
                <p className="text-lg text-muted-foreground mb-8">
                  O <strong className="text-foreground">MAPSO (Mapeamento de Aspectos Psicossociais Organizacionais)</strong> 
                  é a ferramenta científica desenvolvida especificamente para atender todos os requisitos 
                  da nova NR1, oferecendo uma solução completa e automatizada.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">100% Conforme</h3>
                    <p className="text-sm text-muted-foreground">Atende integralmente às exigências da NR1</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Rápida Implementação</h3>
                    <p className="text-sm text-muted-foreground">Resultados em até 72 horas</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Base Científica</h3>
                    <p className="text-sm text-muted-foreground">Fundamentado em modelos validados internacionalmente</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link to="/mapso">
                      Conhecer MAPSO
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/empresas">Solicitar Demonstração</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default NR1;