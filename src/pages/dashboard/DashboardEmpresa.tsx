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
import { Building2, Plus, Trash2, Users } from "lucide-react";
import { sanitizeString } from "@/lib/validation";

interface Empresa {
  id: string;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  telefone: string | null;
  celular: string | null;
}

interface Colaborador {
  id: string;
  nome: string | null;
  data_nascimento: string | null;
}

export default function DashboardEmpresa() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [novoColab, setNovoColab] = useState({ nome: "", data_nascimento: "" });
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Empresa>>({});

  useEffect(() => {
    if (user) {
      fetchEmpresa();
    }
  }, [user]);

  const fetchEmpresa = async () => {
    const { data } = await supabase.from("empresas").select("*").eq("profile_id", user!.id).single();
    if (data) {
      setEmpresa(data);
      setForm(data);
      fetchColaboradores(data.id);
    }
  };

  const fetchColaboradores = async (empresaId: string) => {
    const { data } = await supabase.from("colaboradores").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false });
    if (data) setColaboradores(data);
  };

  const updateEmpresa = async () => {
    if (!empresa) return;
    const { error } = await supabase.from("empresas").update({
      razao_social: sanitizeString(form.razao_social, 200),
      cnpj: sanitizeString(form.cnpj, 20),
      email: sanitizeString(form.email, 255),
      cep: sanitizeString(form.cep, 10),
      rua: sanitizeString(form.rua, 200),
      numero: sanitizeString(form.numero, 20),
      telefone: sanitizeString(form.telefone, 20),
      celular: sanitizeString(form.celular, 20),
    }).eq("id", empresa.id);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Dados salvos!" });
      setEditMode(false);
      fetchEmpresa();
    }
  };

  const addColaborador = async () => {
    if (!empresa || !novoColab.nome) return;
    const { error } = await supabase.from("colaboradores").insert({
      empresa_id: empresa.id,
      nome: novoColab.nome,
      data_nascimento: novoColab.data_nascimento || null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } else {
      setNovoColab({ nome: "", data_nascimento: "" });
      fetchColaboradores(empresa.id);
    }
  };

  const deleteColaborador = async (id: string) => {
    await supabase.from("colaboradores").delete().eq("id", id);
    if (empresa) fetchColaboradores(empresa.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard Empresa</h1>
          </div>

          {/* Company Data */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dados da Empresa</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancelar" : "Editar"}
              </Button>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "razao_social", label: "Razão Social" },
                    { key: "cnpj", label: "CNPJ" },
                    { key: "email", label: "E-mail" },
                    { key: "cep", label: "CEP" },
                    { key: "rua", label: "Rua" },
                    { key: "numero", label: "Número" },
                    { key: "telefone", label: "Telefone" },
                    { key: "celular", label: "Celular" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label>{label}</Label>
                      <Input value={(form as any)[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div className="col-span-full">
                    <Button onClick={updateEmpresa}>Salvar</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Razão Social:</strong> {empresa?.razao_social || "—"}</div>
                  <div><strong>CNPJ:</strong> {empresa?.cnpj || "—"}</div>
                  <div><strong>E-mail:</strong> {empresa?.email || "—"}</div>
                  <div><strong>CEP:</strong> {empresa?.cep || "—"}</div>
                  <div><strong>Rua:</strong> {empresa?.rua || "—"}</div>
                  <div><strong>Número:</strong> {empresa?.numero || "—"}</div>
                  <div><strong>Telefone:</strong> {empresa?.telefone || "—"}</div>
                  <div><strong>Celular:</strong> {empresa?.celular || "—"}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Colaboradores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Colaboradores ({colaboradores.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input placeholder="Nome do colaborador" value={novoColab.nome} onChange={(e) => setNovoColab({ ...novoColab, nome: e.target.value })} />
                <Input type="date" value={novoColab.data_nascimento} onChange={(e) => setNovoColab({ ...novoColab, data_nascimento: e.target.value })} className="w-48" />
                <Button onClick={addColaborador} size="icon"><Plus className="w-4 h-4" /></Button>
              </div>
              {colaboradores.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum colaborador cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {colaboradores.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <span className="font-medium">{c.nome}</span>
                        {c.data_nascimento && <span className="text-muted-foreground text-sm ml-2">• {c.data_nascimento}</span>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteColaborador(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
