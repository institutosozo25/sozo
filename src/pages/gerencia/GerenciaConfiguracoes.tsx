import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { sanitizeString } from "@/lib/validation";

export default function GerenciaConfiguracoes() {
  const { user, accountType } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [entityId, setEntityId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (accountType === "empresa") {
      supabase.from("empresas").select("*").eq("profile_id", user.id).single().then(({ data }) => {
        if (data) { setForm(data); setEntityId(data.id); }
      });
    } else {
      supabase.from("profissionais").select("*").eq("profile_id", user.id).single().then(({ data }) => {
        if (data) { setForm(data); setEntityId(data.id); }
      });
    }
  }, [user, accountType]);

  const save = async () => {
    if (!entityId) return;
    const table = accountType === "empresa" ? "empresas" : "profissionais";
    
    const updateData = accountType === "empresa"
      ? {
          razao_social: sanitizeString(form.razao_social, 200),
          cnpj: sanitizeString(form.cnpj, 20),
          email: sanitizeString(form.email, 255),
          cep: sanitizeString(form.cep, 10),
          rua: sanitizeString(form.rua, 200),
          numero: sanitizeString(form.numero, 20),
          telefone: sanitizeString(form.telefone, 20),
          celular: sanitizeString(form.celular, 20),
        }
      : {
          endereco: sanitizeString(form.endereco, 200),
          idade: form.idade,
          estado_civil: sanitizeString(form.estado_civil, 50),
          sexo: sanitizeString(form.sexo, 20),
        };

    const { error } = await supabase.from(table).update(updateData).eq("id", entityId);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Dados salvos!" });
      setEditMode(false);
    }
  };

  const empresaFields = [
    { key: "razao_social", label: "Razão Social" },
    { key: "cnpj", label: "CNPJ" },
    { key: "email", label: "E-mail" },
    { key: "cep", label: "CEP" },
    { key: "rua", label: "Rua" },
    { key: "numero", label: "Número" },
    { key: "telefone", label: "Telefone" },
    { key: "celular", label: "Celular" },
  ];

  const profFields: { key: string; label: string; type?: string }[] = [
    { key: "endereco", label: "Endereço" },
    { key: "idade", label: "Idade", type: "number" },
    { key: "estado_civil", label: "Estado Civil" },
    { key: "sexo", label: "Sexo" },
  ];

  const fields: { key: string; label: string; type?: string }[] = accountType === "empresa" ? empresaFields : profFields;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {accountType === "empresa" ? "Dados da Empresa" : "Meus Dados"}
          </h1>
          <p className="text-muted-foreground">Gerencie suas informações cadastrais.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informações</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Cancelar" : "Editar"}
          </Button>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ key, label, type }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <Input
                    type={type || "text"}
                    value={form[key] || ""}
                    onChange={(e) => setForm({ ...form, [key]: type === "number" ? parseInt(e.target.value) || null : e.target.value })}
                    maxLength={key === "email" ? 255 : 200}
                  />
                </div>
              ))}
              <div className="col-span-full">
                <Button onClick={save}>Salvar</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {fields.map(({ key, label }) => (
                <div key={key}><strong>{label}:</strong> {form[key] || "—"}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
