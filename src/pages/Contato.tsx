import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Youtube, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";

const Contato = () => {
  const { data: settings, isLoading } = useSiteSettings();

  const s = (key: string, fallback: string = "") => settings?.[key] ?? fallback;

  return (
    <>
      <Helmet>
        <title>Contato | Instituto Plenitude Sozo</title>
        <meta name="description" content="Entre em contato com o Instituto Plenitude Sozo." />
      </Helmet>
      <div className="min-h-screen">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto px-4 lg:px-8 text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                Fale Conosco
              </span>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
                Entre em Contato
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Estamos prontos para ajudar você, sua equipe ou sua empresa a alcançar o máximo potencial com nossas ferramentas de avaliação comportamental.
              </p>
            </div>
          </section>

          <section className="py-16">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-foreground mb-1">E-mail</h3>
                      {isLoading ? <Skeleton className="h-4 w-40 mx-auto" /> : (
                        <a href={`mailto:${s("contact_email")}`} className="text-primary hover:underline">
                          {s("contact_email")}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-foreground mb-1">Telefone / WhatsApp</h3>
                      {isLoading ? <Skeleton className="h-4 w-32 mx-auto" /> : (
                        <a href={`https://wa.me/${s("contact_whatsapp")}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {s("contact_phone")}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-foreground mb-1">Horário de Atendimento</h3>
                      {isLoading ? <Skeleton className="h-4 w-40 mx-auto" /> : (
                        <p className="text-muted-foreground">{s("contact_hours")}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-start">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Nosso Endereço</h2>
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">Instituto Plenitude Sozo</p>
                      {isLoading ? (
                        <>
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-4 w-36" />
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground">{s("contact_address")}</p>
                          <p className="text-muted-foreground">{s("contact_city")}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Redes Sociais</h2>
                  <div className="flex gap-4">
                    {[
                      { key: "social_instagram", icon: Instagram },
                      { key: "social_facebook", icon: Facebook },
                      { key: "social_linkedin", icon: Linkedin },
                      { key: "social_youtube", icon: Youtube },
                    ].map(({ key, icon: Icon }) => {
                      const url = s(key);
                      if (!url) return null;
                      return (
                        <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="p-8 flex flex-col gap-6">
                    <MessageCircle className="w-10 h-10" />
                    <h3 className="font-heading text-2xl font-bold">Precisa de ajuda com a NR1?</h3>
                    <p className="text-primary-foreground/80">
                      Nossa equipe especializada pode orientar sua empresa na adequação aos riscos psicossociais exigidos pela NR1 através da ferramenta MAPSO.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="secondary" size="lg" asChild>
                        <a href={`https://wa.me/${s("contact_whatsapp")}`} target="_blank" rel="noopener noreferrer">
                          Falar pelo WhatsApp
                        </a>
                      </Button>
                      <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                        <a href={`mailto:${s("contact_email")}`}>
                          Enviar E-mail
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Contato;
