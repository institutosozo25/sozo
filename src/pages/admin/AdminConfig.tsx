import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, Mail, CreditCard } from "lucide-react";

export default function AdminConfig() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Configurações</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Configurações Gerais</CardTitle>
                <CardDescription>Nome do site, logo, informações de contato</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Configurar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Database className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-lg">Banco de Dados</CardTitle>
                <CardDescription>Backup, exportação de dados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Gerenciar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">E-mail</CardTitle>
                <CardDescription>Templates de e-mail, configurações SMTP</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Configurar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sozo-green/10">
                <CreditCard className="w-5 h-5 text-sozo-green" />
              </div>
              <div>
                <CardTitle className="text-lg">Pagamentos (Stripe)</CardTitle>
                <CardDescription>Chaves de API, webhooks, planos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Configurar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
