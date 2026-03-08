import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, FileText, ExternalLink, Clock } from "lucide-react";
import { Link } from "react-router-dom";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [dados, setDados] = useState<UsuarioTeste | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <User className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">Minha Conta</h1>
          </div>

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

          <Card>
            <CardHeader><CardTitle>Testes Disponíveis</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Explore os testes disponíveis na plataforma.</p>
              <div className="flex gap-2">
                <Button asChild><Link to="/testes">Ver Testes</Link></Button>
                <Button variant="outline" asChild><Link to="/mapso">MAPSO</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
