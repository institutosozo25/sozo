import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Lock } from "lucide-react";
import { sanitizeString } from "@/lib/validation";
import LogoUpload from "@/components/empresa/LogoUpload";

const lockedEmpresaFields = [
  { key: "cnpj", label: "CNPJ" },
  { key: "razao_social", label: "Razão Social" },
  { key: "nome_fantasia", label: "Nome Fantasia" },
  { key: "responsavel", label: "Responsável" },
];

const editableEmpresaFields = [
  { key: "email", label: "E-mail" },
  { key: "cep", label: "CEP" },
  { key: "rua", label: "Rua" },
  { key: "numero", label: "Número" },
  { key: "telefone", label: "Telefone" },
  { key: "celular", label: "Celular" },
];

export default function GerenciaConfiguracoes() {
  const { user, plan } = useAuth();
  const isEnterprise = plan === "enterprise";
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [entityId, setEntityId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (isEnterprise) {
      supabase.from("empresas").select("*").eq("profile_id", user.id).single().then(({ data }) => {
        if (data) { setForm(data); setEntityId(data.id); }
      });
    } else {
      supabase.from("profissionais").select("*").eq("profile_id", user.id).single().then(({ data }) => {
        if (data) { setForm(data); setEntityId(data.id); }
      });
    }
  }, [user, plan, isEnterprise]);

  const save = async () => {
    if (!entityId) return;
    const table = isEnterprise ? "empresas" : "profissionais";
    
    // Only save editable fields — never update locked fields
    const updateData = isEnterprise
      ? {
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

  const profFields: { key: string; label: string; type?: string }[] = [
    { key: "endereco", label: "Endereço" },
    { key: "idade", label: "Idade", type: "number" },
    { key: "estado_civil", label: "Estado Civil" },
    { key: "sexo", label: "Sexo" },
  ];

  function formatCnpj(value: string | null): string {
    if (!value) return "—";
    const d = value.replace(/\D/g, "");
    if (d.length !== 14) return value;
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {isEnterprise ? "Dados da Empresa" : "Meus Dados"}
          </h1>
          <p className="text-muted-foreground">Gerencie suas informações cadastrais.</p>
        </div>
      </div>

      {/* Logo upload for empresa */}
      {isEnterprise && user && entityId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Logo da Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoUpload
              userId={user.id}
              currentLogoUrl={form.logo_url || null}
              onLogoChange={(url) => setForm({ ...form, logo_url: url })}
              empresaId={entityId}
            />
          </CardContent>
        </Card>
      )}

      {/* Locked fields for empresa */}
      {isEnterprise && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Dados Cadastrais (não editáveis)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {lockedEmpresaFields.map(({ key, label }) => (
                <div key={key}>
                  <strong className="text-muted-foreground">{label}:</strong>
                  <p className="flex items-center gap-2">
                    {key === "cnpj" ? formatCnpj(form[key]) : (form[key] || "—")}
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">Bloqueado</Badge>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEnterprise ? "Informações Adicionais" : "Informações"}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
            {editMode ? "Cancelar" : "Editar"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEnterprise ? (
            editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editableEmpresaFields.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label>{label}</Label>
                    <Input
                      value={form[key] || ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
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
                {editableEmpresaFields.map(({ key, label }) => (
                  <div key={key}><strong>{label}:</strong> {form[key] || "—"}</div>
                ))}
              </div>
            )
          ) : (
            editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profFields.map(({ key, label, type }) => (
                  <div key={key} className="space-y-1">
                    <Label>{label}</Label>
                    <Input
                      type={type || "text"}
                      value={form[key] || ""}
                      onChange={(e) => setForm({ ...form, [key]: type === "number" ? parseInt(e.target.value) || null : e.target.value })}
                      maxLength={200}
                    />
                  </div>
                ))}
                <div className="col-span-full">
                  <Button onClick={save}>Salvar</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {profFields.map(({ key, label }) => (
                  <div key={key}><strong>{label}:</strong> {form[key] || "—"}</div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
