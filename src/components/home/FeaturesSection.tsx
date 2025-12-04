import { Brain, Heart, Sparkles, BarChart3, Shield, Users } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Testes Cientificamente Validados",
    description: "Todos os nossos testes são baseados em metodologias reconhecidas e validadas cientificamente.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Sparkles,
    title: "Relatórios por IA",
    description: "Relatórios detalhados gerados por inteligência artificial com insights personalizados.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: BarChart3,
    title: "Análises Profundas",
    description: "Gráficos interativos e análises comportamentais para entender seu perfil.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Heart,
    title: "Desenvolvimento Emocional",
    description: "Ferramentas para desenvolver inteligência emocional e autoconhecimento.",
    color: "bg-sozo-red/10 text-sozo-red",
  },
  {
    icon: Shield,
    title: "Privacidade Garantida",
    description: "Seus dados são protegidos com criptografia de ponta e máxima segurança.",
    color: "bg-sozo-brown/10 text-sozo-brown",
  },
  {
    icon: Users,
    title: "Para Todos os Perfis",
    description: "Soluções para indivíduos, profissionais de saúde mental e empresas.",
    color: "bg-sozo-blue/10 text-sozo-blue",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
            Por que escolher o Sozo?
          </span>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Tecnologia a serviço do seu
            <span className="text-gradient block">desenvolvimento pessoal</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Combinamos ciência, tecnologia e experiência para oferecer as melhores 
            ferramentas de autoconhecimento.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-secondary/30 transition-all duration-300 hover:shadow-sozo-lg animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
