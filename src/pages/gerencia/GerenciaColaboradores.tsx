import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2 } from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";

interface Colaborador {
  id: string;
  nome: string | null;
  data_nascimento: string | null;
}

export default function GerenciaColaboradores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [novoColab, setNovoColab] = useState({ nome: "", data_nascimento: "" });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("empresas").select("id").eq("profile_id", user.id).single();
      if (data) {
        setEmpresaId(data.id);
        fetchColaboradores(data.id);
      }
    };
    fetch();
  }, [user]);

  const fetchColaboradores = async (eid: string) => {
    const { data } = await supabase.from("colaboradores").select("*").eq("empresa_id", eid).order("created_at", { ascending: false });
    if (data) setColaboradores(data);
  };

  const addColaborador = async () => {
    if (!empresaId || !novoColab.nome) return;
    const { error } = await supabase.from("colaboradores").insert({
      empresa_id: empresaId,
      nome: sanitizeString(novoColab.nome, 200),
      data_nascimento: novoColab.data_nascimento || null,
    });
    if (error) {
      toast({ title: "Erro ao adicionar", variant: "destructive" });
    } else {
      setNovoColab({ nome: "", data_nascimento: "" });
      fetchColaboradores(empresaId);
    }
  };

  const deleteColaborador = async (id: string) => {
    await supabase.from("colaboradores").delete().eq("id", id);
    if (empresaId) fetchColaboradores(empresaId);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie os colaboradores da sua empresa.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input placeholder="Nome do colaborador" value={novoColab.nome} onChange={(e) => setNovoColab({ ...novoColab, nome: e.target.value })} maxLength={200} />
            <Input type="date" value={novoColab.data_nascimento} onChange={(e) => setNovoColab({ ...novoColab, data_nascimento: e.target.value })} className="w-48" />
            <Button onClick={addColaborador} size="icon"><Plus className="w-4 h-4" /></Button>
          </div>

          {colaboradores.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum colaborador cadastrado.</p>
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
  );
}
