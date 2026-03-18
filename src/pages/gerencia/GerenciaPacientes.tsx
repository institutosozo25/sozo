import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2 } from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

interface Paciente {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

export default function GerenciaPacientes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profId, setProfId] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [novo, setNovo] = useState({ nome: "", email: "", telefone: "" });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("profissionais").select("id").eq("profile_id", user.id).single();
      if (data) {
        setProfId(data.id);
        fetchPacientes(data.id);
      }
    };
    fetch();
  }, [user]);

  const fetchPacientes = async (pid: string) => {
    const { data } = await supabase.from("pacientes").select("*").eq("profissional_id", pid).order("created_at", { ascending: false });
    if (data) setPacientes(data);
  };

  const addPaciente = async () => {
    if (!profId || !novo.nome) return;
    const { error } = await supabase.from("pacientes").insert({
      profissional_id: profId,
      nome: sanitizeString(novo.nome, 200),
      email: novo.email ? sanitizeString(novo.email, 255) : null,
      telefone: novo.telefone ? sanitizeString(novo.telefone, 20) : null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } else {
      setNovo({ nome: "", email: "", telefone: "" });
      fetchPacientes(profId);
    }
  };

  const deletePaciente = async (id: string) => {
    await supabase.from("pacientes").delete().eq("id", id);
    if (profId) fetchPacientes(profId);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie seus pacientes cadastrados.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} maxLength={200} />
            <Input placeholder="E-mail" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} maxLength={255} />
            <Input placeholder="Telefone" value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value.replace(/[^\d\s()+-]/g, "") })} maxLength={20} />
            <Button onClick={addPaciente} size="icon"><Plus className="w-4 h-4" /></Button>
          </div>

          {pacientes.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum paciente cadastrado.</p>
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
  );
}
