import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { loginSchema, signupSchema } from "@/lib/validation";
import EmpresaSignupFields from "@/components/auth/EmpresaSignupFields";
import ProfissionalSignupFields from "@/components/auth/ProfissionalSignupFields";

type AccountType = "empresa" | "profissional" | "usuario";

const accountTypes: { value: AccountType; label: string; description: string; icon: typeof Building2 }[] = [
  { value: "empresa", label: "Empresa", description: "Gerencie colaboradores e clima organizacional", icon: Building2 },
  { value: "profissional", label: "Profissional", description: "Gerencie pacientes e aplique testes", icon: Stethoscope },
  { value: "usuario", label: "Usuário", description: "Acesse testes e resultados pessoais", icon: User },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [telefone, setTelefone] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("usuario");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [termosConsent, setTermosConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Empresa-specific fields
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Profissional-specific fields
  const [tipoPessoa, setTipoPessoa] = useState<"pf" | "pj">("pf");
  const [profCpf, setProfCpf] = useState("");
  const [profNomeMae, setProfNomeMae] = useState("");
  const [profDataNascimento, setProfDataNascimento] = useState("");
  const [profCnpj, setProfCnpj] = useState("");
  const [profNomeFantasia, setProfNomeFantasia] = useState("");
  const [profRazaoSocial, setProfRazaoSocial] = useState("");

  const { signIn, signUp, user, plan } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      if (plan === "enterprise" || plan === "professional") {
        navigate("/gerencia");
      } else {
        navigate("/dashboard/usuario");
      }
    }
  }, [user, plan, navigate]);

  const validateEmpresaFields = (): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    const cnpjDigits = cnpj.replace(/\D/g, "");
    if (cnpjDigits.length !== 14) fieldErrors.cnpj = "CNPJ deve ter 14 dígitos";
    if (!razaoSocial.trim()) fieldErrors.razaoSocial = "Razão social é obrigatória";
    if (!nomeFantasia.trim()) fieldErrors.nomeFantasia = "Nome fantasia é obrigatório";
    if (!responsavel.trim()) fieldErrors.responsavel = "Responsável é obrigatório";
    return fieldErrors;
  };

  const validateProfissionalFields = (): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    if (tipoPessoa === "pf") {
      const cpfDigits = profCpf.replace(/\D/g, "");
      if (cpfDigits.length !== 11) fieldErrors.cpf = "CPF deve ter 11 dígitos";
      if (!profNomeMae.trim()) fieldErrors.nomeMae = "Nome da mãe é obrigatório";
      if (!profDataNascimento) fieldErrors.dataNascimento = "Data de nascimento é obrigatória";
    } else {
      const cnpjDigits = profCnpj.replace(/\D/g, "");
      if (cnpjDigits.length !== 14) fieldErrors.profCnpj = "CNPJ deve ter 14 dígitos";
      if (!profNomeFantasia.trim()) fieldErrors.profNomeFantasia = "Nome fantasia é obrigatório";
      if (!profRazaoSocial.trim()) fieldErrors.profRazaoSocial = "Razão social é obrigatória";
    }
    return fieldErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          let message = error.message;
          if (error.message === "Invalid login credentials") {
            message = "E-mail ou senha incorretos";
          } else if (error.message === "Email not confirmed") {
            message = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
          }
          toast({ title: "Erro ao entrar", description: message, variant: "destructive" });
        } else {
          toast({ title: "Bem-vindo de volta!" });
        }
      } else {
        const result = signupSchema.safeParse({ email, password, confirmPassword, fullName, telefone });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        // Validate type-specific fields
        if (accountType === "empresa") {
          const empresaErrors = validateEmpresaFields();
          if (Object.keys(empresaErrors).length > 0) {
            setErrors(empresaErrors);
            setIsSubmitting(false);
            return;
          }
        }

        if (accountType === "profissional") {
          const profErrors = validateProfissionalFields();
          if (Object.keys(profErrors).length > 0) {
            setErrors(profErrors);
            setIsSubmitting(false);
            return;
          }
        }

        if (!lgpdConsent) {
          setErrors({ lgpd: "Você deve aceitar a Política de Privacidade para continuar." });
          setIsSubmitting(false);
          return;
        }

        if (!termosConsent) {
          setErrors({ termos: "Você deve aceitar os Termos de Uso para continuar." });
          setIsSubmitting(false);
          return;
        }

        const empresaData = accountType === "empresa"
          ? { cnpj: cnpj.replace(/\D/g, ""), razaoSocial, nomeFantasia, responsavel }
          : undefined;

        const profissionalData = accountType === "profissional"
          ? tipoPessoa === "pf"
            ? { tipoPessoa: "pf" as const, cpf: profCpf.replace(/\D/g, ""), nomeMae: profNomeMae, dataNascimento: profDataNascimento }
            : { tipoPessoa: "pj" as const, cnpj: profCnpj.replace(/\D/g, ""), nomeFantasia: profNomeFantasia, razaoSocial: profRazaoSocial }
          : undefined;

        const { error } = await signUp(email, password, fullName, accountType, telefone, empresaData, profissionalData);
        if (error) {
          let message = error.message;
          if (error.message.includes("already registered")) {
            message = "Este e-mail já está cadastrado";
          }
          toast({ title: "Erro ao criar conta", description: message, variant: "destructive" });
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu e-mail para confirmar o cadastro antes de fazer login.",
          });
          setIsLogin(true);
        }
      }
    } catch {
      toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl border border-border p-8 shadow-sozo-lg">
              <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
                {isLogin ? "Entrar" : "Criar Conta"}
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                {isLogin ? "Acesse sua conta para continuar" : "Preencha seus dados para criar sua conta"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    {/* Account Type Selector */}
                    <div className="space-y-2">
                      <Label>Tipo de conta</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {accountTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setAccountType(type.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center",
                              accountType === type.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-muted-foreground text-muted-foreground"
                            )}
                          >
                            <type.icon className="w-5 h-5" />
                            <span className="text-xs font-semibold">{type.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {accountTypes.find(t => t.value === accountType)?.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome completo</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" maxLength={100} className={errors.fullName ? "border-destructive" : ""} />
                      {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" maxLength={255} className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      inputMode="numeric"
                      value={telefone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                        let masked = digits;
                        if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                        if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                        setTelefone(masked);
                      }}
                      placeholder="(11) 99999-0000"
                      maxLength={16}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={errors.password ? "border-destructive" : ""} />
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar senha</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={errors.confirmPassword ? "border-destructive" : ""} />
                      {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                    </div>

                    {/* Empresa-specific fields */}
                    {accountType === "empresa" && (
                      <EmpresaSignupFields
                        cnpj={cnpj} setCnpj={setCnpj}
                        razaoSocial={razaoSocial} setRazaoSocial={setRazaoSocial}
                        nomeFantasia={nomeFantasia} setNomeFantasia={setNomeFantasia}
                        responsavel={responsavel} setResponsavel={setResponsavel}
                        errors={errors}
                      />
                    )}

                    {/* Profissional-specific fields */}
                    {accountType === "profissional" && (
                      <ProfissionalSignupFields
                        tipoPessoa={tipoPessoa} setTipoPessoa={setTipoPessoa}
                        cpf={profCpf} setCpf={setProfCpf}
                        nomeMae={profNomeMae} setNomeMae={setProfNomeMae}
                        dataNascimento={profDataNascimento} setDataNascimento={setProfDataNascimento}
                        cnpj={profCnpj} setCnpj={setProfCnpj}
                        nomeFantasia={profNomeFantasia} setNomeFantasia={setProfNomeFantasia}
                        razaoSocial={profRazaoSocial} setRazaoSocial={setProfRazaoSocial}
                        errors={errors}
                      />
                    )}

                    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <Checkbox
                        id="lgpd-consent"
                        checked={lgpdConsent}
                        onCheckedChange={(checked) => setLgpdConsent(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="lgpd-consent" className="cursor-pointer text-xs text-muted-foreground leading-snug">
                        Declaro que li e concordo com a{" "}
                        <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>{" "}
                        e o tratamento de dados conforme a LGPD (Lei Geral de Proteção de Dados).
                      </label>
                    </div>
                    {errors.lgpd && <p className="text-destructive text-sm">{errors.lgpd}</p>}

                    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                      <Checkbox
                        id="termos-consent"
                        checked={termosConsent}
                        onCheckedChange={(checked) => setTermosConsent(checked === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor="termos-consent" className="cursor-pointer text-xs text-muted-foreground leading-snug">
                        Declaro que li e concordo com os{" "}
                        <Link to="/termos" className="text-primary hover:underline">Termos de Uso</Link>{" "}
                        da plataforma Plenitude Sozo.
                      </label>
                    </div>
                    {errors.termos && <p className="text-destructive text-sm">{errors.termos}</p>}
                  </>
                )}

                <Button type="submit" className="w-full" variant="hero" disabled={isSubmitting}>
                  {isSubmitting ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-primary hover:underline text-sm block mx-auto">
                  {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
                </button>
                {isLogin && (
                  <Link to="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline text-sm block">
                    Esqueci minha senha
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
