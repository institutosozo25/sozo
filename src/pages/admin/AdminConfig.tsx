import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Mail, CreditCard, HardDrive, CheckCircle2, XCircle, Loader2, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TestStatus = "idle" | "loading" | "ok" | "error" | "info";

interface TestResult {
  status: TestStatus;
  message?: string;
  details?: Record<string, unknown>;
}

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === "idle") return null;
  if (status === "loading") return <Badge variant="outline" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Testando...</Badge>;
  if (status === "ok") return <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3" />Conectado</Badge>;
  if (status === "info") return <Badge variant="outline" className="gap-1 border-blue-200 text-blue-600"><Info className="w-3 h-3" />Info</Badge>;
  return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Erro</Badge>;
}

export default function AdminConfig() {
  const { toast } = useToast();

  const [asaasResult, setAsaasResult] = useState<TestResult>({ status: "idle" });
  const [driveResult, setDriveResult] = useState<TestResult>({ status: "idle" });
  const [smtpResult, setSmtpResult] = useState<TestResult>({ status: "idle" });
  const [dbResult, setDbResult] = useState<TestResult>({ status: "idle" });

  const runAction = async (
    action: string,
    setter: (r: TestResult) => void,
  ) => {
    setter({ status: "loading" });
    try {
      const { data, error } = await supabase.functions.invoke("admin-config", {
        body: { action },
      });

      if (error) {
        setter({ status: "error", message: error.message });
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }

      const status: TestStatus = data.status === "ok" ? "ok" : data.status === "info" ? "info" : "error";
      setter({ status, message: data.message, details: data.details });

      if (status === "ok") {
        toast({ title: "Sucesso", description: data.message });
      } else if (status === "error") {
        toast({ title: "Erro", description: data.message, variant: "destructive" });
      } else {
        toast({ title: "Informação", description: data.message });
      }
    } catch (e) {
      setter({ status: "error", message: "Erro de conexão" });
      toast({ title: "Erro", description: "Falha na conexão com o servidor", variant: "destructive" });
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Configurações</h1>
      <p className="text-muted-foreground mb-8">Teste e verifique as integrações do sistema.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Asaas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sozo-green/10">
                  <CreditCard className="w-5 h-5 text-sozo-green" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pagamentos (Asaas)</CardTitle>
                  <CardDescription>Gateway de pagamentos Pix e Cartão</CardDescription>
                </div>
              </div>
              <StatusBadge status={asaasResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {asaasResult.message && (
              <p className={`text-sm ${asaasResult.status === "ok" ? "text-emerald-600" : asaasResult.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {asaasResult.message}
              </p>
            )}
            {asaasResult.details && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>Ambiente:</strong> {String(asaasResult.details.env)}</p>
                <p><strong>Saldo:</strong> R$ {Number(asaasResult.details.balance).toFixed(2)}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => runAction("test-asaas", setAsaasResult)}
              disabled={asaasResult.status === "loading"}
            >
              {asaasResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Testar Conexão
            </Button>
          </CardContent>
        </Card>

        {/* Google Drive */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <HardDrive className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google Drive</CardTitle>
                  <CardDescription>Armazenamento de relatórios e laudos</CardDescription>
                </div>
              </div>
              <StatusBadge status={driveResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {driveResult.message && (
              <p className={`text-sm ${driveResult.status === "ok" ? "text-emerald-600" : driveResult.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {driveResult.message}
              </p>
            )}
            {driveResult.details && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>Pasta:</strong> {String(driveResult.details.folderName)}</p>
                <p><strong>ID:</strong> {String(driveResult.details.folderId)}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => runAction("test-google-drive", setDriveResult)}
              disabled={driveResult.status === "loading"}
            >
              {driveResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Testar Conexão
            </Button>
          </CardContent>
        </Card>

        {/* SMTP / E-mail */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Mail className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">E-mail / SMTP</CardTitle>
                  <CardDescription>Envio de e-mails transacionais</CardDescription>
                </div>
              </div>
              <StatusBadge status={smtpResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {smtpResult.message && (
              <p className={`text-sm ${smtpResult.status === "info" ? "text-blue-600" : smtpResult.status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
                {smtpResult.message}
              </p>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => runAction("test-smtp", setSmtpResult)}
              disabled={smtpResult.status === "loading"}
            >
              {smtpResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Verificar Status
            </Button>
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Database className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Banco de Dados</CardTitle>
                  <CardDescription>Estatísticas e visão geral dos dados</CardDescription>
                </div>
              </div>
              <StatusBadge status={dbResult.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dbResult.details && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>Perfis:</strong> {String(dbResult.details.profiles)}</p>
                <p><strong>Submissões:</strong> {String(dbResult.details.submissions)}</p>
                <p><strong>Pagamentos:</strong> {String(dbResult.details.payments)}</p>
                <p><strong>Empresas:</strong> {String(dbResult.details.empresas)}</p>
                <p><strong>Avaliações MAPSO:</strong> {String(dbResult.details.mapso_assessments)}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => runAction("get-db-stats", setDbResult)}
              disabled={dbResult.status === "loading"}
            >
              {dbResult.status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Carregar Estatísticas
            </Button>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Configurações Gerais</CardTitle>
                <CardDescription>Informações de contato e identidade do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 space-y-2">
              <p>As informações de contato (telefone, e-mail, endereço, redes sociais) são exibidas na página <strong>/contato</strong> e no rodapé do site.</p>
              <p>Para alterar essas informações, solicite a edição diretamente — elas serão atualizadas no código-fonte e refletidas em todo o site.</p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                💡 Dica: Informe os novos dados de contato no chat e a atualização será aplicada automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
