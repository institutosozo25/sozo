import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, FileText, ExternalLink, Clock, Download, AlertTriangle, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { sanitizeString } from "@/lib/validation";

interface UsuarioTeste {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

interface TestSubmission {
  id: string;
  respondent_name: string;
  status: string | null;
  completed_at: string | null;
  test_result_unlocked: boolean;
  generated_reports: { id: string; created_at: string }[];
}

export default function DashboardUsuario() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dados, setDados] = useState<UsuarioTeste | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDados();
      fetchSubmissions();
    }
  }, [user]);

  const fetchDados = async () => {
    const { data } = await supabase.from("usuarios_testes").select("*").eq("profile_id", user!.id).single();
    if (data) {
      setDados(data);
      setForm({ nome: data.nome || "", email: data.email || "", telefone: data.telefone || "" });
    }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    const { data } = await supabase
      .from("test_submissions")
      .select("id, respondent_name, status, completed_at, test_result_unlocked, generated_reports(id, created_at)")
      .eq("user_id", user!.id)
      .order("completed_at", { ascending: false })
      .limit(20);
    if (data) {
      setSubmissions(data as unknown as TestSubmission[]);
    }
    setLoadingSubmissions(false);
  };

  const save = async () => {
    if (!dados) return;
    const safeName = sanitizeString(form.nome, 100);
    const safeEmail = sanitizeString(form.email, 255);
    const safeTelefone = sanitizeString(form.telefone, 20);
    const { error } = await supabase.from("usuarios_testes").update({
      nome: safeName, email: safeEmail, telefone: safeTelefone,
    }).eq("id", dados.id);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Dados salvos!" });
      setEditMode(false);
      fetchDados();
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [profileRes, submissionsRes, reportsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase.from("test_submissions").select("*").eq("user_id", user!.id),
        supabase.from("generated_reports")
          .select("id, scores, created_at, submission_id")
          .in("submission_id",
            (await supabase.from("test_submissions").select("id").eq("user_id", user!.id)).data?.map(s => s.id) || []
          ),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data,
        test_submissions: submissionsRes.data,
        reports: reportsRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-sozo-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Dados exportados com sucesso!" });
    } catch {
      toast({ title: "Erro ao exportar dados", variant: "destructive" });
    }
    setIsExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "EXCLUIR") return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_own_account");
      if (error) throw error;
      await signOut();
      navigate("/");
      toast({ title: "Conta excluída permanentemente" });
    } catch (err: any) {
      toast({ title: "Erro ao excluir conta", description: err?.message || "Tente novamente.", variant: "destructive" });
    }
    setIsDeleting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <User className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">Minha Conta</h1>
          </div>

          {/* Meus Dados */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Meus Dados</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancelar" : "Editar"}
              </Button>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div className="space-y-1"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} maxLength={100} /></div>
                  <div className="space-y-1"><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} /></div>
                  <div className="space-y-1"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value.replace(/[^\d\s()+-]/g, "") })} maxLength={20} /></div>
                  <Button onClick={save}>Salvar</Button>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div><strong>Nome:</strong> {dados?.nome || "—"}</div>
                  <div><strong>E-mail:</strong> {dados?.email || "—"}</div>
                  <div><strong>Telefone:</strong> {dados?.telefone || "—"}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meus Relatórios */}
          <Card className="mb-8">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Meus Relatórios</CardTitle></CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">Você ainda não completou nenhum teste.</p>
                  <Button asChild variant="outline"><Link to="/testes">Explorar Testes</Link></Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                      <div>
                        <p className="font-medium text-foreground text-sm">{sub.respondent_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {sub.completed_at ? new Date(sub.completed_at).toLocaleDateString("pt-BR") : "—"}
                          {sub.generated_reports?.length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                              Relatório disponível
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.generated_reports?.length > 0 ? (
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/relatorio/${sub.generated_reports[0].id}`}>
                              <ExternalLink className="w-3 h-3 mr-1" /> Ver Relatório
                            </Link>
                          </Button>
                        ) : sub.status === "completed" ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">Concluído</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">Pendente</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Testes Disponíveis */}
          <Card className="mb-8">
            <CardHeader><CardTitle>Testes Disponíveis</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Explore os testes disponíveis na plataforma.</p>
              <div className="flex gap-2">
                <Button asChild><Link to="/testes">Ver Testes</Link></Button>
                <Button variant="outline" asChild><Link to="/mapso">MAPSO</Link></Button>
              </div>
            </CardContent>
          </Card>

          {/* LGPD - Privacidade */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" /> Privacidade e Dados (LGPD)</CardTitle>
              <CardDescription>Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <h4 className="font-medium text-foreground text-sm mb-1">Exportar meus dados</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Faça o download de todos os seus dados pessoais, incluindo perfil e resultados de testes, em formato JSON.
                </p>
                <Button variant="outline" size="sm" onClick={handleExportData} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exportando..." : "Exportar meus dados"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Perigo */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Zona de Perigo
              </CardTitle>
              <CardDescription>Ações irreversíveis na sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <h4 className="font-medium text-foreground text-sm mb-1">Excluir minha conta permanentemente</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Todos os seus dados serão apagados permanentemente, incluindo perfil, testes realizados e relatórios. Esta ação não pode ser desfeita.
                </p>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir minha conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Excluir conta permanentemente
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Todos os seus dados, testes e relatórios serão apagados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Digite <strong>EXCLUIR</strong> para confirmar:</Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="EXCLUIR"
                maxLength={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(""); }}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== "EXCLUIR" || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? "Excluindo..." : "Excluir permanentemente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
