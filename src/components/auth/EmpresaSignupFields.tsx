import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  cnpj: string;
  setCnpj: (v: string) => void;
  razaoSocial: string;
  setRazaoSocial: (v: string) => void;
  nomeFantasia: string;
  setNomeFantasia: (v: string) => void;
  responsavel: string;
  setResponsavel: (v: string) => void;
  errors: Record<string, string>;
}

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export default function EmpresaSignupFields({
  cnpj, setCnpj, razaoSocial, setRazaoSocial,
  nomeFantasia, setNomeFantasia, responsavel, setResponsavel, errors,
}: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
      <p className="text-xs font-semibold text-primary">Dados obrigatórios da empresa</p>

      <div className="space-y-1">
        <Label htmlFor="cnpj">CNPJ *</Label>
        <Input
          id="cnpj"
          value={cnpj}
          onChange={(e) => setCnpj(maskCnpj(e.target.value))}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          className={errors.cnpj ? "border-destructive" : ""}
        />
        {errors.cnpj && <p className="text-destructive text-xs">{errors.cnpj}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="razaoSocial">Razão Social *</Label>
        <Input
          id="razaoSocial"
          value={razaoSocial}
          onChange={(e) => setRazaoSocial(e.target.value)}
          placeholder="Empresa Exemplo Ltda"
          maxLength={200}
          className={errors.razaoSocial ? "border-destructive" : ""}
        />
        {errors.razaoSocial && <p className="text-destructive text-xs">{errors.razaoSocial}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
        <Input
          id="nomeFantasia"
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
          placeholder="Nome comercial da empresa"
          maxLength={200}
          className={errors.nomeFantasia ? "border-destructive" : ""}
        />
        {errors.nomeFantasia && <p className="text-destructive text-xs">{errors.nomeFantasia}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="responsavel">Responsável *</Label>
        <Input
          id="responsavel"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          placeholder="Nome do responsável pela conta"
          maxLength={100}
          className={errors.responsavel ? "border-destructive" : ""}
        />
        {errors.responsavel && <p className="text-destructive text-xs">{errors.responsavel}</p>}
      </div>

      <p className="text-[11px] text-muted-foreground">
        ⚠️ Esses dados não poderão ser alterados após o cadastro.
      </p>
    </div>
  );
}
