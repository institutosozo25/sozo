import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Heart, Target, Eye, Users } from "lucide-react";
const values = [{
  icon: Heart,
  title: "Plenitude",
  description: "Buscamos o desenvolvimento integral do ser humano em todas as suas dimensões."
}, {
  icon: Target,
  title: "Propósito",
  description: "Cada ferramenta é projetada para ajudar você a descobrir e viver seu propósito."
}, {
  icon: Eye,
  title: "Clareza",
  description: "Oferecemos insights claros e acionáveis para sua jornada de autoconhecimento."
}, {
  icon: Users,
  title: "Comunidade",
  description: "Construímos uma comunidade de pessoas comprometidas com o crescimento."
}];
export default function Sobre() {
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Instituto Plenitude
              <span className="block text-accent">Sozo</span>
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
              Desde 2015 transformando vidas através do autoconhecimento, 
              desenvolvimento pessoal e ferramentas científicas.
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
              <p className="mb-4">O Instituto Plenitude Sozo nasceu da paixão por ajudar pessoas a descobrirem seu verdadeiro potencial. Fundado por Everton Nunes, o instituto começou como um pequeno consultório e hoje se tornou o maior Plataforma de testes de desenvolvimento pessoal do Brasil.</p>
              <p className="mb-4">
                A palavra "Sozo" vem do grego e significa "salvar, curar, libertar, tornar completo". 
                Esse é exatamente nosso propósito: ajudar pessoas a alcançarem plenitude em todas 
                as áreas da vida - emocional, comportamental, profissional e espiritual.
              </p>
              <p>
                Com mais de 50 testes cientificamente validados e relatórios gerados por 
                inteligência artificial, oferecemos as ferramentas mais avançadas para 
                autoconhecimento disponíveis no mercado.
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
              Princípios que guiam tudo o que fazemos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {values.map(value => <div key={value.title} className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {value.description}
                </p>
              </div>)}
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
                Democratizar o acesso a ferramentas de autoconhecimento de alta qualidade, 
                permitindo que cada pessoa descubra seu potencial e viva uma vida plena e com propósito.
              </p>
            </div>
            <div className="p-8 rounded-2xl gradient-warm text-primary-foreground">
              <h3 className="font-heading text-2xl font-bold mb-4">Visão</h3>
              <p className="text-primary-foreground/80">
                Ser a principal referência em desenvolvimento pessoal e autoconhecimento 
                na América Latina, impactando positivamente milhões de vidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
}