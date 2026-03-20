import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import {
  Users, BarChart3, CheckCircle2, Clock, Loader2,
  Copy, ExternalLink, Share2, LinkIcon, Brain, Sparkles, Heart, Users as UsersIcon, Shield,
} from "lucide-react";

const TEST_META: Record<string, { name: string; fullName: string; description: string; icon: any; gradient: string }> = {
  disc: { name: "DISC", fullName: "Análise Comportamental DISC", description: "Perfil comportamental Dominante, Influente, Estável e Conforme", icon: Brain, gradient: "from-blue-500 to-cyan-500" },
  mbti: { name: "MBTI", fullName: "Teste de Personalidade MBTI", description: "Identificação dos 16 tipos de personalidade", icon: Sparkles, gradient: "from-purple-500 to-pink-500" },
  temperamento: { name: "Temperamento", fullName: "Análise de Temperamento", description: "Mapeamento profundo de temperamento", icon: Heart, gradient: "from-orange-500 to-red-500" },
  eneagrama: { name: "Eneagrama", fullName: "Teste de Eneagrama", description: "Identificação dos 9 tipos de personalidade", icon: UsersIcon, gradient: "from-green-500 to-emerald-500" },
};

interface Props {
  testType: "disc" | "mbti" | "temperamento" | "eneagrama";
}

interface SharedLink {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function GerenciaTesteDashboard({ testType }: Props) {
  const { user, plan } = useAuth();
  const isEnterprise = plan === "enterprise";
  const meta = TEST_META[testType];
  const Icon = meta.icon;

  const [loading, setLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState<{ id: string; type: "empresa" | "profissional"; name: string } | null>(null);
  const [peopleCount, setPeopleCount] = useState(0);
  const [activeLink, setActiveLink] = useState<SharedLink | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);

      // Get owner
      let ownerId = "";
      let ownerName = "";
      let ownerType: "empresa" | "profissional" = "empresa";

      if (isEnterprise) {
        const { data } = await supabase.from("empresas").select("id, razao_social").eq("profile_id", user.id).single();
        if (data) { ownerId = data.id; ownerName = data.razao_social || "Empresa"; ownerType = "empresa"; }
      } else {
        const { data } = await supabase.from("profissionais").select("id, nome_fantasia, razao_social").eq("profile_id", user.id).single();
        if (data) { ownerId = data.id; ownerName = data.nome_fantasia || data.razao_social || "Profissional"; ownerType = "profissional"; }
      }

      if (!ownerId) { setLoading(false); return; }
      setOwnerInfo({ id: ownerId, type: ownerType, name: ownerName });

      // Get people count
      if (isEnterprise) {
        const { count } = await supabase.from("mapso_employees" as any).select("*", { count: "exact", head: true }).eq("empresa_id", ownerId);
        setPeopleCount(count || 0);
      } else {
        const { count } = await supabase.from("pacientes").select("*", { count: "exact", head: true }).eq("profissional_id", ownerId);
        setPeopleCount(count || 0);
      }

      // Get active link for this test
      const { data: links } = await supabase
        .from("shared_test_links" as any)
        .select("*")
        .eq("created_by", user.id)
        .eq("test_type", testType)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (links && links.length > 0) setActiveLink(links[0] as any);

      setLoading(false);
    };
    fetchData();
  }, [user, isEnterprise, testType]);

  const generateLink = async () => {
    if (!user || !ownerInfo) return;
    setIsGenerating(true);
    try {
      const insertData: any = {
        test_type: testType,
        created_by: user.id,
        ...(ownerInfo.type === "empresa"
          ? { empresa_id: ownerInfo.id }
          : { profissional_id: ownerInfo.id }),
      };

      const { data, error } = await supabase
        .from("shared_test_links" as any)
        .insert(insertData)
        .select("*")
        .single();

      if (error) throw error;
      setActiveLink(data as any);
      setShareOpen(true);
    } catch (e) {
      console.error("Error generating link:", e);
      toast({ title: "Erro ao gerar link", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const getLinkUrl = () => {
    if (!activeLink) return "";
    return `${window.location.origin}/teste/respond/${(activeLink as any).token}`;
  };

  const copyToClipboard = async () => {
    const url = getLinkUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    sonnerToast.success("Link copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    const url = getLinkUrl();
    const personLabel = isEnterprise ? "colaborador(a)" : "paciente";
    const message = encodeURIComponent(
      `Olá! Você foi convidado(a) a responder o teste *${meta.fullName}* na plataforma Sozo.\n\nAcesse o link abaixo para iniciar:\n${url}\n\nVocê precisará informar seu CPF e data de nascimento para validar sua identidade.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const personLabel = isEnterprise ? "colaboradores" : "pacientes";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className={`rounded-xl bg-gradient-to-br ${meta.gradient} p-3`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">{meta.fullName}</h1>
          <p className="text-muted-foreground text-sm">{ownerInfo?.name} · {meta.description}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{peopleCount}</p>
                <p className="text-xs text-muted-foreground capitalize">{personLabel} cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2 text-accent"><LinkIcon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeLink ? "Ativo" : "—"}</p>
                <p className="text-xs text-muted-foreground">Link de acesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 p-2 text-secondary"><BarChart3 className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">Respostas recebidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate / Share Link */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Aplicar Teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Gere um link e compartilhe com seus {personLabel}. Eles precisarão informar CPF e data de nascimento para validar a identidade.
          </p>

          {activeLink ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{getLinkUrl()}</span>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyToClipboard} variant="outline">
                  <Copy className="w-4 h-4 mr-2" /> {copied ? "Copiado!" : "Copiar Link"}
                </Button>
                <Button onClick={shareWhatsApp} className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-accent-foreground">
                  <ExternalLink className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
                <Button variant="ghost" onClick={generateLink} disabled={isGenerating}>
                  Gerar novo link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expira em {new Date(activeLink.expires_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ) : (
            <Button onClick={generateLink} disabled={isGenerating} size="lg">
              <LinkIcon className="w-4 h-4 mr-2" />
              {isGenerating ? "Gerando..." : "Gerar Link de Acesso"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for future: results tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Os resultados dos {personLabel} que responderem aparecerão aqui. Compartilhe o link acima para começar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
