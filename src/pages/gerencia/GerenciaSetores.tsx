import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Plus, Trash2, AlertTriangle } from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import { toast } from "sonner";

interface Setor {
  id: string;
  nome: string;
  created_at: string;
}

interface EmployeeCount {
  setor_id: string | null;
  count: number;
}

export default function GerenciaSetores() {
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<EmployeeCount[]>([]);
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
    const [setoresRes, employeesRes] = await Promise.all([
      supabase.from("setores" as any).select("*").eq("empresa_id", eid).order("nome"),
      supabase.from("mapso_employees" as any).select("setor_id").eq("empresa_id", eid),
    ]);
    setSetores((setoresRes.data as any[]) || []);

    // Count employees per sector
    const counts: Record<string, number> = {};
    let noSector = 0;
    for (const emp of (employeesRes.data as any[]) || []) {
      if (emp.setor_id) {
        counts[emp.setor_id] = (counts[emp.setor_id] || 0) + 1;
      } else {
        noSector++;
      }
    }
    const countArr: EmployeeCount[] = Object.entries(counts).map(([setor_id, count]) => ({ setor_id, count }));
    countArr.push({ setor_id: null, count: noSector });
    setEmployeeCounts(countArr);
  };

  const getCount = (setorId: string) => employeeCounts.find((c) => c.setor_id === setorId)?.count || 0;
  const unassignedCount = employeeCounts.find((c) => c.setor_id === null)?.count || 0;

  const addSetor = async () => {
    if (!empresaId || !novoSetor.trim()) return;
    const nome = sanitizeString(novoSetor.trim(), 100);
    const { error } = await supabase.from("setores" as any).insert({ empresa_id: empresaId, nome } as any);
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
    await supabase.from("setores" as any).delete().eq("id", id);
    toast.success("Setor excluído.");
    fetchData(empresaId);
  };

  const sectorsWithWarning = useMemo(() => {
    return setores.map((s) => ({
      ...s,
      employeeCount: getCount(s.id),
      warning: getCount(s.id) > 0 && getCount(s.id) < 3,
    }));
  }, [setores, employeeCounts]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Layers className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Setores</h1>
          <p className="text-muted-foreground">Gerencie os setores da sua empresa para organizar as avaliações MAPSO.</p>
        </div>
      </div>

      {/* Anonymity warning */}
      <div className="mb-6 rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-destructive">
          ATENÇÃO: Para garantir o anonimato do MAPSO, recomenda-se no mínimo 3 colaboradores por setor.
          Setores com menos de 3 colaboradores podem comprometer a confidencialidade das respostas individuais.
        </p>
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
