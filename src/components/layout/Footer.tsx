import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";

const footerLinks = {
  testes: [
    { name: "DISC", href: "/testes/disc" },
    { name: "Perfil Comportamental", href: "/testes/comportamental" },
    { name: "Inteligência Emocional", href: "/testes/inteligencia-emocional" },
    { name: "Linguagens do Amor", href: "/testes/linguagens-amor" },
    { name: "Ver Todos", href: "/testes" },
  ],
  empresa: [
    { name: "Sobre Nós", href: "/sobre" },
    { name: "Blog", href: "/blog" },
    { name: "Contato", href: "/contato" },
    { name: "Trabalhe Conosco", href: "/carreiras" },
  ],
  suporte: [
    { name: "Central de Ajuda", href: "/ajuda" },
    { name: "Termos de Uso", href: "/termos" },
    { name: "Política de Privacidade", href: "/privacidade" },
    { name: "FAQ", href: "/faq" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center border border-primary-foreground/20">
                <span className="text-primary-foreground font-heading font-bold text-xl">S</span>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/70 uppercase tracking-widest">Instituto Plenitude</p>
                <p className="font-heading font-bold text-xl">SOZO</p>
              </div>
            </Link>
            <p className="text-primary-foreground/80 mb-6 max-w-sm">
              O maior marketplace de testes de desenvolvimento pessoal do Brasil. 
              Descubra seu potencial com ferramentas científicas e relatórios por IA.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/institutoplenitudesozo" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-bold mb-4">Testes</h3>
            <ul className="space-y-3">
              {footerLinks.testes.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4">Empresa</h3>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-bold mb-4">Suporte</h3>
            <ul className="space-y-3">
              {footerLinks.suporte.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 Instituto Plenitude Sozo. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-primary-foreground/60">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              contato@plenitudesozo.com.br
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
