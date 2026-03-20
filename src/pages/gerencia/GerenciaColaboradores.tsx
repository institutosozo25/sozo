import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Trash2, CheckCircle2, Clock } from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import { toast } from "sonner";

interface Colaborador {
  id: string;
  name: string;
  cpf: string | null;
  data_nascimento: string | null;
  setor_id: string | null;
  status: string;
  department: string | null;
}

interface Setor {
  id: string;
  nome: string;
}

export default function GerenciaColaboradores() {
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [novo, setNovo] = useState({ name: "", cpf: "", data_nascimento: "", setor_id: "" });
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
    const [colabRes, setoresRes] = await Promise.all([
      supabase.from("mapso_employees" as any).select("*").eq("empresa_id", eid).order("created_at", { ascending: false }),
      supabase.from("setores" as any).select("*").eq("empresa_id", eid).order("nome"),
    ]);
    setColaboradores((colabRes.data as any[]) || []);
    setSetores((setoresRes.data as any[]) || []);
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const validateCpf = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(digits[9]) !== check) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    return parseInt(digits[10]) === check;
  };

  const addColaborador = async () => {
    if (!empresaId || !novo.name.trim()) return;

    // Validate CPF
    if (novo.cpf) {
      if (!validateCpf(novo.cpf)) {
        toast.error("CPF inválido. Verifique os dígitos.");
        return;
      }
    }

    // Validate data nascimento
    if (!novo.data_nascimento) {
      toast.error("Data de nascimento é obrigatória.");
      return;
    }

    if (!novo.cpf) {
      toast.error("CPF é obrigatório.");
      return;
    }

    const { error } = await supabase.from("mapso_employees" as any).insert({
      empresa_id: empresaId,
      name: sanitizeString(novo.name, 200),
      cpf: novo.cpf.replace(/\D/g, ""),
      data_nascimento: novo.data_nascimento || null,
      setor_id: novo.setor_id || null,
      department: getSetorNome(novo.setor_id) || null,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast.error("Já existe um colaborador com esse CPF nesta empresa.");
      } else {
        toast.error("Erro ao adicionar colaborador.");
        console.error(error);
      }
    } else {
      setNovo({ name: "", cpf: "", data_nascimento: "", setor_id: "" });
      toast.success("Colaborador adicionado!");
      fetchData(empresaId);
    }
  };

  const deleteColaborador = async (id: string) => {
    await supabase.from("mapso_employees" as any).delete().eq("id", id);
    if (empresaId) fetchData(empresaId);
    toast.success("Colaborador removido.");
  };

  const getSetorNome = (setorId: string | null) => {
    if (!setorId) return null;
    return setores.find((s) => s.id === setorId)?.nome || null;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground">Gerencie os colaboradores da sua empresa para avaliações MAPSO.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Adicionar Colaborador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div className="space-y-1">
              <Label>Nome completo *</Label>
              <Input
                value={novo.name}
                onChange={(e) => setNovo({ ...novo, name: e.target.value })}
                placeholder="Nome do colaborador"
                maxLength={200}
              />
            </div>
            <div className="space-y-1">
              <Label>CPF *</Label>
              <Input
                value={novo.cpf}
                onChange={(e) => setNovo({ ...novo, cpf: formatCpf(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="space-y-1">
              <Label>Data de nascimento *</Label>
              <Input
                type="date"
                value={novo.data_nascimento}
                onChange={(e) => setNovo({ ...novo, data_nascimento: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Setor</Label>
              <Select value={novo.setor_id} onValueChange={(v) => setNovo({ ...novo, setor_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.length === 0 ? (
                    <SelectItem value="none" disabled>Crie setores primeiro</SelectItem>
                  ) : (
                    setores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end lg:col-span-2">
              <Button
                onClick={addColaborador}
                disabled={!novo.name.trim() || !novo.cpf || !novo.data_nascimento}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Colaboradores ({colaboradores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {colaboradores.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum colaborador cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {colaboradores.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{c.name}</span>
                      {c.status === "concluido" ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Concluído
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="h-3 w-3" /> Pendente
                        </Badge>
                      )}
                      {(c.setor_id || c.department) && (
                        <Badge variant="secondary" className="text-xs">
                          {getSetorNome(c.setor_id) || c.department}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {c.cpf && <span>CPF: {formatCpf(c.cpf)}</span>}
                      {c.data_nascimento && <span>Nasc: {new Date(c.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR")}</span>}
                    </div>
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
