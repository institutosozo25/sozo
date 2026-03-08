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
import { Stethoscope, Plus, Trash2, Users } from "lucide-react";
import { sanitizeString } from "@/lib/validation";

interface Profissional {
  id: string;
  endereco: string | null;
  idade: number | null;
  estado_civil: string | null;
  sexo: string | null;
}

interface Paciente {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  idade: number | null;
  estado_civil: string | null;
  sexo: string | null;
}

export default function DashboardProfissional() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [novoPaciente, setNovoPaciente] = useState({ nome: "", email: "", telefone: "" });
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Profissional>>({});

  useEffect(() => {
    if (user) fetchProfissional();
  }, [user]);

  const fetchProfissional = async () => {
    const { data } = await supabase.from("profissionais").select("*").eq("profile_id", user!.id).single();
    if (data) {
      setProfissional(data);
      setForm(data);
      fetchPacientes(data.id);
    }
  };

  const fetchPacientes = async (profissionalId: string) => {
    const { data } = await supabase.from("pacientes").select("*").eq("profissional_id", profissionalId).order("created_at", { ascending: false });
    if (data) setPacientes(data);
  };

  const updateProfissional = async () => {
    if (!profissional) return;
    const { error } = await supabase.from("profissionais").update({
      endereco: sanitizeString(form.endereco, 200), idade: form.idade, estado_civil: sanitizeString(form.estado_civil, 50), sexo: sanitizeString(form.sexo, 20),
    }).eq("id", profissional.id);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Dados salvos!" });
      setEditMode(false);
      fetchProfissional();
    }
  };

  const addPaciente = async () => {
    if (!profissional || !novoPaciente.nome) return;
    const { error } = await supabase.from("pacientes").insert({
      profissional_id: profissional.id,
      nome: novoPaciente.nome,
      email: novoPaciente.email || null,
      telefone: novoPaciente.telefone || null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } else {
      setNovoPaciente({ nome: "", email: "", telefone: "" });
      fetchPacientes(profissional.id);
    }
  };

  const deletePaciente = async (id: string) => {
    await supabase.from("pacientes").delete().eq("id", id);
    if (profissional) fetchPacientes(profissional.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-8">
            <Stethoscope className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard Profissional</h1>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1"><Label>Endereço</Label><Input value={form.endereco || ""} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Idade</Label><Input type="number" value={form.idade || ""} onChange={(e) => setForm({ ...form, idade: parseInt(e.target.value) || null })} /></div>
                  <div className="space-y-1"><Label>Estado Civil</Label><Input value={form.estado_civil || ""} onChange={(e) => setForm({ ...form, estado_civil: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Sexo</Label><Input value={form.sexo || ""} onChange={(e) => setForm({ ...form, sexo: e.target.value })} /></div>
                  <div className="col-span-full"><Button onClick={updateProfissional}>Salvar</Button></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Endereço:</strong> {profissional?.endereco || "—"}</div>
                  <div><strong>Idade:</strong> {profissional?.idade || "—"}</div>
                  <div><strong>Estado Civil:</strong> {profissional?.estado_civil || "—"}</div>
                  <div><strong>Sexo:</strong> {profissional?.sexo || "—"}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Pacientes ({pacientes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input placeholder="Nome" value={novoPaciente.nome} onChange={(e) => setNovoPaciente({ ...novoPaciente, nome: e.target.value })} />
                <Input placeholder="E-mail" value={novoPaciente.email} onChange={(e) => setNovoPaciente({ ...novoPaciente, email: e.target.value })} />
                <Input placeholder="Telefone" value={novoPaciente.telefone} onChange={(e) => setNovoPaciente({ ...novoPaciente, telefone: e.target.value })} />
                <Button onClick={addPaciente} size="icon"><Plus className="w-4 h-4" /></Button>
              </div>
              {pacientes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum paciente cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {pacientes.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <span className="font-medium">{p.nome}</span>
                        {p.email && <span className="text-muted-foreground text-sm ml-2">• {p.email}</span>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deletePaciente(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
