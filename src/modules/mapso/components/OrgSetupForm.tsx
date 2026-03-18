import { useState, useEffect } from "react";
import { Building2, Users, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssessment } from "../contexts/AssessmentContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ConsentDialog from "./ConsentDialog";
import logoSozo from "../assets/logo-sozo.png";

const sectors = [
  "Tecnologia", "Saúde", "Educação", "Indústria", "Varejo",
  "Financeiro", "Governo", "Serviços", "Construção", "Outro",
];

const OrgSetupForm = () => {
  const { setOrganization, setCurrentStep, setConsentAccepted } = useAssessment();
  const { user, plan } = useAuth();
  const isEnterprise = plan === "enterprise";

  const [form, setForm] = useState({ name: "", sector: "", department: "", employeeCount: "" });
  const [showConsent, setShowConsent] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [empresaLoaded, setEmpresaLoaded] = useState(false);

  // Auto-pull empresa data for enterprise users
  useEffect(() => {
    if (!isEnterprise || !user) return;
    setLoadingEmpresa(true);
    supabase
      .from("empresas")
      .select("razao_social, nome_fantasia, cnpj, responsavel")
      .eq("profile_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const empresaName = (data as any).nome_fantasia || (data as any).razao_social || "";
          setForm((prev) => ({ ...prev, name: empresaName }));
          setEmpresaLoaded(true);
        }
        setLoadingEmpresa(false);
      });
  }, [isEnterprise, user]);

  const isValid = form.name.trim().length > 0 && form.sector.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setOrganization(form);
    setShowConsent(true);
  };

  const handleConsentAccept = () => {
    setConsentAccepted(true);
    setShowConsent(false);
    setCurrentStep("questionnaire");
  };

  if (loadingEmpresa) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-lg animate-fade-up">
          <div className="mb-8 text-center">
            <img src={logoSozo} alt="Instituto Plenitude Sozo" className="mx-auto mb-6 h-12 rounded-lg bg-primary p-2" />
            <div className="mx-auto mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-foreground font-heading">Cadastro Organizacional</h1>
            <p className="text-muted-foreground">Identifique a organização para iniciar a avaliação MAPSO</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-8 shadow-md">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Nome da Organização *
              </Label>
              <Input
                id="name"
                placeholder="Ex: Empresa ABC Ltda"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                disabled={empresaLoaded}
              />
              {empresaLoaded && (
                <p className="text-xs text-muted-foreground">Preenchido automaticamente a partir dos dados cadastrais.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Setor de Atuação *
              </Label>
              <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept">Departamento / Unidade (opcional)</Label>
              <Input
                id="dept"
                placeholder="Ex: TI, RH, Operações"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="count" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Nº de Colaboradores (opcional)
              </Label>
              <Input
                id="count"
                type="number"
                placeholder="Ex: 150"
                value={form.employeeCount}
                onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
                min={1}
                max={999999}
              />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={!isValid}>
              Continuar para o Questionário
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <button
            onClick={() => setCurrentStep("landing")}
            className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar ao início
          </button>
        </div>
      </div>

      <ConsentDialog
        open={showConsent}
        onAccept={handleConsentAccept}
        onCancel={() => setShowConsent(false)}
      />
    </>
  );
};

export default OrgSetupForm;
