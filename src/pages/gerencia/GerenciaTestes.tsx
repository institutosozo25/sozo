import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Brain, Users, Sparkles, Heart, Shield,
  Copy, Share2, CheckCircle, Link as LinkIcon, ExternalLink, Clock, Plus,
} from "lucide-react";

const TEST_CATALOG = [
  { slug: "disc", name: "DISC", description: "Análise Comportamental Profissional", icon: Brain, gradient: "from-blue-500 to-cyan-500" },
  { slug: "mbti", name: "MBTI", description: "Teste de Personalidade", icon: Sparkles, gradient: "from-purple-500 to-pink-500" },
  { slug: "temperamento", name: "Temperamento", description: "Análise de Temperamento Profunda", icon: Heart, gradient: "from-orange-500 to-red-500" },
  { slug: "eneagrama", name: "Eneagrama", description: "Teste de Eneagrama", icon: Users, gradient: "from-green-500 to-emerald-500" },
  { slug: "mapso", name: "MAPSO / NR1", description: "Avaliação Psicossocial NR1", icon: Shield, gradient: "from-primary to-secondary" },
];

interface SharedLink {
  id: string;
  test_type: string;
  token: string;
  expires_at: string;
  status: string;
  created_at: string;
}

export default function GerenciaTestes() {
  const { user, plan } = useAuth();
  const isEnterprise = plan === "enterprise";
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [selectedTest, setSelectedTest] = useState<typeof TEST_CATALOG[0] | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState<{ id: string; type: "empresa" | "profissional" } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchOwnerAndLinks = async () => {
      // Determine owner
      if (isEnterprise) {
        const { data } = await supabase.from("empresas").select("id").eq("profile_id", user.id).single();
        if (data) setOwnerInfo({ id: data.id, type: "empresa" });
      } else {
        const { data } = await supabase.from("profissionais").select("id").eq("profile_id", user.id).single();
        if (data) setOwnerInfo({ id: data.id, type: "profissional" });
      }

      // Fetch existing links
      const { data: linksData } = await supabase
        .from("shared_test_links" as any)
        .select("*")
        .eq("created_by", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (linksData) setLinks(linksData as any);
    };
    fetchOwnerAndLinks();
  }, [user, isEnterprise]);

  const generateLink = async (test: typeof TEST_CATALOG[0]) => {
    if (!user || !ownerInfo) return;
    setIsGenerating(true);
    setSelectedTest(test);

    try {
      const insertData: any = {
        test_type: test.slug,
        created_by: user.id,
        ...(ownerInfo.type === "empresa"
          ? { empresa_id: ownerInfo.id }
          : { profissional_id: ownerInfo.id }),
      };

      const { data, error } = await supabase
        .from("shared_test_links" as any)
        .insert(insertData)
        .select("token")
        .single();

      if (error) throw error;

      const token = (data as any).token;
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/teste/respond/${token}`;
      setGeneratedLink(link);

      // Refresh links
      const { data: linksData } = await supabase
        .from("shared_test_links" as any)
        .select("*")
        .eq("created_by", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (linksData) setLinks(linksData as any);
    } catch (e) {
      console.error("Error generating link:", e);
      toast({ title: "Erro", description: "Não foi possível gerar o link.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareWhatsApp = () => {
    if (!generatedLink || !selectedTest) return;
    const personLabel = isEnterprise ? "colaborador(a)" : "paciente";
    const message = encodeURIComponent(
      `Olá! Você foi convidado(a) a responder o teste *${selectedTest.name}* na plataforma Sozo.\n\nAcesse o link abaixo para iniciar:\n${generatedLink}\n\nVocê precisará informar seu CPF e data de nascimento para validar sua identidade.`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const getActiveLink = (testSlug: string) => {
    return links.find((l) => l.test_type === testSlug);
  };

  const getExistingLinkUrl = (token: string) => {
    return `${window.location.origin}/teste/respond/${token}`;
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Aplicar Testes</h1>
      <p className="text-muted-foreground mb-8">
        Gere links para compartilhar com seus {isEnterprise ? "colaboradores" : "pacientes"} e acompanhe as respostas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEST_CATALOG.map((test) => {
          const activeLink = getActiveLink(test.slug);
          const Icon = test.icon;

          return (
            <Card key={test.slug} className="overflow-hidden hover:shadow-sozo-md transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${test.gradient}`} />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-xl bg-gradient-to-br ${test.gradient} p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {activeLink && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" /> Link ativo
                    </Badge>
                  )}
                </div>

                <h3 className="font-heading font-bold text-lg text-foreground mb-1">{test.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{test.description}</p>

                {activeLink ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        .../{activeLink.token.slice(0, 12)}...
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(getExistingLinkUrl(activeLink.token));
                          toast({ title: "Link copiado!" });
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTest(test);
                          setGeneratedLink(getExistingLinkUrl(activeLink.token));
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-1" /> Compartilhar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateLink(test)}
                        disabled={isGenerating}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expira em {new Date(activeLink.expires_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => generateLink(test)}
                    disabled={isGenerating}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Gerar Link
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Share Dialog */}
      <Dialog open={!!generatedLink} onOpenChange={(open) => { if (!open) { setGeneratedLink(null); setSelectedTest(null); setCopied(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Compartilhar {selectedTest?.name}
            </DialogTitle>
            <DialogDescription>
              Envie este link para seus {isEnterprise ? "colaboradores" : "pacientes"}.
              Eles precisarão informar CPF e data de nascimento para validar a identidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Link display */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
              <input
                readOnly
                value={generatedLink || ""}
                className="flex-1 bg-transparent text-sm outline-none text-foreground"
              />
              <Button size="sm" variant={copied ? "default" : "outline"} onClick={copyToClipboard}>
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="w-full justify-start">
                <Copy className="w-4 h-4 mr-3" />
                {copied ? "Copiado!" : "Copiar Link"}
              </Button>
              <Button onClick={shareWhatsApp} className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                <ExternalLink className="w-4 h-4 mr-3" />
                Compartilhar via WhatsApp
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              O link expira em 30 dias. Você pode gerar novos links a qualquer momento.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
