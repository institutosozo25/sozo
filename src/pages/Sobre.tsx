import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Heart, Target, Eye, Users, Award, BookOpen } from "lucide-react";

const values = [
  { icon: Heart, title: "Plenitude", description: "Buscamos o desenvolvimento integral do ser humano em todas as suas dimensões: emocional, comportamental, profissional e espiritual." },
  { icon: Target, title: "Propósito", description: "Cada ferramenta é projetada para ajudar pessoas e organizações a alcançarem seu máximo potencial com clareza e direção." },
  { icon: Eye, title: "Excelência", description: "Utilizamos metodologias científicas validadas internacionalmente para garantir a qualidade e precisão dos nossos instrumentos." },
  { icon: Users, title: "Comunidade", description: "Construímos uma rede de profissionais, empresas e pessoas comprometidas com o crescimento e a transformação." },
  { icon: Award, title: "Inovação", description: "Investimos continuamente em tecnologia e pesquisa para oferecer as ferramentas mais avançadas do mercado." },
  { icon: BookOpen, title: "Ética", description: "Atuamos com total conformidade com a LGPD e os mais altos padrões éticos no tratamento de dados e informações pessoais." },
];

export default function Sobre() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Instituto Plenitude
              <span className="block text-accent">SOZO Business</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Desde 2015 transformando vidas e organizações através do autoconhecimento,
              desenvolvimento humano e ferramentas científicas de alta performance.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-6">Nossa História</h2>
            <div className="prose prose-lg text-muted-foreground">
              <p className="mb-4">
                O Instituto Plenitude Sozo nasceu da visão de Everton Nunes de Oliveira — Psicanalista Clínico,
                Analista Comportamental e Coach certificado pelo IBC (ISO 9001) — de democratizar o acesso a
                ferramentas profissionais de autoconhecimento e desenvolvimento humano.
              </p>
              <p className="mb-4">
                A palavra <strong>"Sozo"</strong> vem do grego e significa "salvar, curar, libertar, tornar completo".
                Esse é exatamente nosso propósito: ajudar pessoas e organizações a alcançarem plenitude em todas
                as áreas — emocional, comportamental, profissional e relacional.
              </p>
              <p className="mb-4">
                Hoje, o Instituto Plenitude Sozo é referência no Brasil em avaliações comportamentais e diagnósticos
                psicossociais, atendendo desde indivíduos em busca de autoconhecimento até grandes corporações que
                necessitam de conformidade com a NR-1 para gestão de riscos psicossociais.
              </p>
              <p>
                Com uma plataforma tecnológica robusta, oferecemos testes cientificamente validados — incluindo DISC,
                MBTI, Eneagrama, Temperamentos e o exclusivo MAPSO — acompanhados de relatórios profissionais
                completos que transformam dados em insights acionáveis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Nossos Valores
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Princípios que guiam cada decisão e cada ferramenta que desenvolvemos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
            <div className="p-8 rounded-2xl gradient-primary text-primary-foreground">
              <h3 className="font-heading text-2xl font-bold mb-4">Missão</h3>
              <p className="text-primary-foreground/80">
                Democratizar o acesso a ferramentas de autoconhecimento e diagnóstico organizacional de alta qualidade,
                utilizando ciência e tecnologia para que cada pessoa e empresa alcance seu máximo potencial.
              </p>
            </div>
            <div className="p-8 rounded-2xl gradient-warm text-primary-foreground">
              <h3 className="font-heading text-2xl font-bold mb-4">Visão</h3>
              <p className="text-primary-foreground/80">
                Ser a principal plataforma de desenvolvimento humano e conformidade organizacional da América Latina,
                impactando positivamente milhões de vidas e milhares de empresas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-6">Responsável Técnico</h2>
            <div className="p-8 rounded-2xl bg-card border border-border">
              <h3 className="font-heading text-xl font-bold text-foreground mb-2">Everton Nunes de Oliveira</h3>
              <p className="text-muted-foreground mb-4">Fundador e Diretor Técnico</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Psicanalista Clínico — Certificado 127400 PS</p>
                <p>Analista Comportamental e Coach — IBC / ISO 9001</p>
                <p>CBO 2515-50 · Parecer 159/2000 do MPF</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
