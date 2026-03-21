import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import { toast } from "sonner";

interface Setor {
  id: string;
  nome: string;
  created_at: string;
}

export default function GerenciaSetores() {
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [colaboradorCounts, setColaboradorCounts] = useState<Record<string, number>>({});
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [novoSetor, setNovoSetor] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data } = await supabase.from("empresas").select("id").eq("profile_id", user.id).single();
      if (data) {
        setEmpresaId(data.id);
        await fetchData(data.id);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const fetchData = async (eid: string) => {
    const [setoresRes, colabRes] = await Promise.all([
      supabase.from("setores").select("*").eq("empresa_id", eid).order("nome"),
      supabase.from("colaboradores").select("setor_id").eq("empresa_id", eid),
    ]);
    setSetores((setoresRes.data as any[]) || []);

    const counts: Record<string, number> = {};
    let noSector = 0;
    for (const c of (colabRes.data as any[]) || []) {
      if (c.setor_id) {
        counts[c.setor_id] = (counts[c.setor_id] || 0) + 1;
      } else {
        noSector++;
      }
    }
    setColaboradorCounts(counts);
    setUnassignedCount(noSector);
  };

  const getCount = (setorId: string) => colaboradorCounts[setorId] || 0;

  const addSetor = async () => {
    if (!empresaId || !novoSetor.trim()) return;
    const nome = sanitizeString(novoSetor.trim(), 100);
    const { error } = await supabase.from("setores").insert({ empresa_id: empresaId, nome });
    if (error) {
      if (error.code === "23505") {
        toast.error("Já existe um setor com esse nome.");
      } else {
        toast.error("Erro ao criar setor.");
      }
    } else {
      setNovoSetor("");
      toast.success("Setor criado!");
      fetchData(empresaId);
    }
  };

  const deleteSetor = async (id: string) => {
    if (!empresaId) return;
    const count = getCount(id);
    if (count > 0) {
      toast.error("Remova ou reatribua os colaboradores deste setor antes de excluí-lo.");
      return;
    }
    await supabase.from("setores").delete().eq("id", id);
    toast.success("Setor excluído.");
    fetchData(empresaId);
  };

  const sectorsWithWarning = useMemo(() => {
    return setores.map((s) => ({
      ...s,
      employeeCount: getCount(s.id),
      warning: getCount(s.id) > 0 && getCount(s.id) < 3,
    }));
  }, [setores, colaboradorCounts]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Layers className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Setores</h1>
          <p className="text-muted-foreground">Gerencie os setores da sua empresa para organizar colaboradores e avaliações.</p>
        </div>
      </div>

      {/* Message 1: Precision per sector */}
      <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Resultado mais preciso por setor</p>
          <p className="text-xs text-muted-foreground mt-1">
            Para obter um plano de ação e diagnóstico específico por setor no teste MAPSO, cadastre os setores aqui
            e atribua cada colaborador ao seu setor na seção <strong>"Colaboradores"</strong> (campo "Selecionar setor").
          </p>
        </div>
      </div>

      {/* Message 2: Anonymity warning (red) */}
      <div className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-destructive">⚠️ Aviso de Privacidade — Leitura Obrigatória</p>
          <p className="text-xs text-destructive/80 mt-1">
            É <strong>altamente recomendável</strong> utilizar o diagnóstico por setor no MAPSO apenas quando cada setor
            possuir <strong>no mínimo 3 colaboradores</strong>. Se um setor tiver apenas 1 ou 2 pessoas, o anonimato
            das respostas pode ser comprometido — <strong>absolutamente ninguém deve saber que colaborador respondeu o que</strong>.
            Setores com menos de 3 colaboradores serão sinalizados em vermelho abaixo.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Criar Novo Setor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do setor (ex: Administrativo, Operacional...)"
              value={novoSetor}
              onChange={(e) => setNovoSetor(e.target.value)}
              maxLength={100}
              onKeyDown={(e) => e.key === "Enter" && addSetor()}
            />
            <Button onClick={addSetor} disabled={!novoSetor.trim()} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" /> Criar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> Setores ({setores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {setores.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Nenhum setor cadastrado. Crie setores para organizar seus colaboradores.
            </p>
          ) : (
            <div className="space-y-2">
              {sectorsWithWarning.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    s.warning ? "border-destructive/40 bg-destructive/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{s.nome}</span>
                    <Badge variant="secondary" className="text-xs">
                      {s.employeeCount} colaborador{s.employeeCount !== 1 ? "es" : ""}
                    </Badge>
                    {s.warning && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" /> Mín. 3 recomendado
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteSetor(s.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {unassignedCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{unassignedCount}</span> colaborador{unassignedCount !== 1 ? "es" : ""} sem setor atribuído.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
