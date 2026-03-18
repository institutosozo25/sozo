import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { User, Building2 } from "lucide-react";

type TipoPessoa = "pf" | "pj";

interface Props {
  tipoPessoa: TipoPessoa;
  setTipoPessoa: (v: TipoPessoa) => void;
  // PF fields
  cpf: string;
  setCpf: (v: string) => void;
  nomeMae: string;
  setNomeMae: (v: string) => void;
  dataNascimento: string;
  setDataNascimento: (v: string) => void;
  // PJ fields
  cnpj: string;
  setCnpj: (v: string) => void;
  nomeFantasia: string;
  setNomeFantasia: (v: string) => void;
  razaoSocial: string;
  setRazaoSocial: (v: string) => void;
  errors: Record<string, string>;
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

const tipoPessoaOptions: { value: TipoPessoa; label: string; icon: typeof User }[] = [
  { value: "pf", label: "Pessoa Física", icon: User },
  { value: "pj", label: "Pessoa Jurídica", icon: Building2 },
];

export default function ProfissionalSignupFields({
  tipoPessoa, setTipoPessoa,
  cpf, setCpf, nomeMae, setNomeMae, dataNascimento, setDataNascimento,
  cnpj, setCnpj, nomeFantasia, setNomeFantasia, razaoSocial, setRazaoSocial,
  errors,
}: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/30">
      <p className="text-xs font-semibold text-primary">Tipo de pessoa</p>

      <div className="grid grid-cols-2 gap-2">
        {tipoPessoaOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTipoPessoa(opt.value)}
            className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium",
              tipoPessoa === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-muted-foreground text-muted-foreground"
            )}
          >
            <opt.icon className="w-4 h-4" />
            {opt.label}
          </button>
        ))}
      </div>

      {tipoPessoa === "pf" ? (
        <>
          <div className="space-y-1">
            <Label htmlFor="prof-cpf">CPF *</Label>
            <Input
              id="prof-cpf"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className={errors.cpf ? "border-destructive" : ""}
            />
            {errors.cpf && <p className="text-destructive text-xs">{errors.cpf}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="prof-nome-mae">Nome da mãe *</Label>
            <Input
              id="prof-nome-mae"
              value={nomeMae}
              onChange={(e) => setNomeMae(e.target.value)}
              placeholder="Nome completo da mãe"
              maxLength={100}
              className={errors.nomeMae ? "border-destructive" : ""}
            />
            {errors.nomeMae && <p className="text-destructive text-xs">{errors.nomeMae}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="prof-data-nascimento">Data de nascimento *</Label>
            <Input
              id="prof-data-nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className={errors.dataNascimento ? "border-destructive" : ""}
            />
            {errors.dataNascimento && <p className="text-destructive text-xs">{errors.dataNascimento}</p>}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <Label htmlFor="prof-cnpj">CNPJ *</Label>
            <Input
              id="prof-cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className={errors.profCnpj ? "border-destructive" : ""}
            />
            {errors.profCnpj && <p className="text-destructive text-xs">{errors.profCnpj}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="prof-nome-fantasia">Nome Fantasia *</Label>
            <Input
              id="prof-nome-fantasia"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              placeholder="Nome comercial"
              maxLength={200}
              className={errors.profNomeFantasia ? "border-destructive" : ""}
            />
            {errors.profNomeFantasia && <p className="text-destructive text-xs">{errors.profNomeFantasia}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="prof-razao-social">Razão Social *</Label>
            <Input
              id="prof-razao-social"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Razão social da empresa"
              maxLength={200}
              className={errors.profRazaoSocial ? "border-destructive" : ""}
            />
            {errors.profRazaoSocial && <p className="text-destructive text-xs">{errors.profRazaoSocial}</p>}
          </div>
        </>
      )}

      <p className="text-[11px] text-muted-foreground">
        ⚠️ Esses dados não poderão ser alterados após o cadastro.
      </p>
    </div>
  );
}
