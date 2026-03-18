import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, Eye, Ban, Trash2, Search, CreditCard } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  suspended_at: string | null;
  telefone: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  user: "Usuário",
};

const roleColors: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  user: "bg-muted text-muted-foreground",
};

const planLabels: Record<string, string> = {
  free: "Gratuito",
  individual: "Individual",
  professional: "Profissional",
  enterprise: "Empresarial",
};

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  individual: "bg-accent text-accent-foreground",
  professional: "bg-secondary text-secondary-foreground",
  enterprise: "bg-primary text-primary-foreground",
};

export default function AdminUsuarios() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [detailSubmissions, setDetailSubmissions] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    setProfiles((profilesRes.data as Profile[]) || []);

    const grouped: Record<string, string[]> = {};
    rolesRes.data?.forEach((role: UserRole) => {
      if (!grouped[role.user_id]) grouped[role.user_id] = [];
      grouped[role.user_id].push(role.role);
    });
    setUserRoles(grouped);
    setIsLoading(false);
  }

  function openAddRoleDialog(userId: string) {
    setSelectedUserId(userId);
    setSelectedRole("");
    setIsRoleDialogOpen(true);
  }

  function openPlanDialog(userId: string, currentPlan: string | null) {
    setSelectedUserId(userId);
    setSelectedPlan(currentPlan || "free");
    setIsPlanDialogOpen(true);
  }

  async function openDetailDialog(profile: Profile) {
    setDetailProfile(profile);
    const { count } = await supabase
      .from("test_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id);
    setDetailSubmissions(count || 0);
    setIsDetailDialogOpen(true);
  }

  async function handleAddRole() {
    if (!selectedRole) {
      toast({ title: "Selecione um papel", variant: "destructive" });
      return;
    }
    const currentRoles = userRoles[selectedUserId] || [];
    if (currentRoles.includes(selectedRole)) {
      toast({ title: "Usuário já possui este papel", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: selectedUserId, role: selectedRole as "admin" | "user" });
    if (error) {
      toast({ title: "Erro ao adicionar papel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Papel adicionado!" });
      setIsRoleDialogOpen(false);
      fetchData();
    }
  }

  async function handleSetPlan() {
    if (!selectedPlan) return;
    const { error } = await supabase.rpc("admin_set_user_plan", {
      _target_user_id: selectedUserId,
      _plan: selectedPlan,
      _status: "active",
    });
    if (error) {
      toast({ title: "Erro ao alterar plano", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plano atualizado com sucesso!" });
      setIsPlanDialogOpen(false);
      fetchData();
    }
  }

  async function handleRemoveRole(userId: string, role: string) {
    if (role === "user") {
      toast({ title: "Não é possível remover o papel de usuário básico", variant: "destructive" });
      return;
    }
    if (!confirm(`Remover papel "${roleLabels[role] || role}" deste usuário?`)) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as "admin" | "professional" | "company" | "reseller" | "user");
    if (error) {
      toast({ title: "Erro ao remover papel", variant: "destructive" });
    } else {
      toast({ title: "Papel removido" });
      fetchData();
    }
  }

  async function handleSuspend(userId: string, isSuspended: boolean) {
    const action = isSuspended ? "reativar" : "suspender";
    if (!confirm(`Deseja ${action} esta conta?`)) return;

    const { error } = await supabase.rpc("admin_suspend_user", {
      _target_user_id: userId,
      _suspend: !isSuspended,
    });
    if (error) {
      toast({ title: `Erro ao ${action}`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: isSuspended ? "Conta reativada" : "Conta suspensa" });
      fetchData();
    }
  }

  async function handleDeleteUser(userId: string, name: string) {
    if (!confirm(`ATENÇÃO: Esta ação é irreversível!\n\nExcluir permanentemente o usuário "${name}"?\nTodos os dados serão apagados.`)) return;
    if (!confirm("Tem certeza absoluta? Essa ação não pode ser desfeita.")) return;

    const { error } = await supabase.rpc("admin_delete_user", {
      _target_user_id: userId,
    });
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário excluído permanentemente" });
      setIsDetailDialogOpen(false);
      fetchData();
    }
  }

  const filteredProfiles = profiles.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(term) ||
      (p.email || "").toLowerCase().includes(term)
    );
  });

  function getPlanDisplay(plan: string | null) {
    const key = plan || "free";
    return { label: planLabels[key] || key, color: planColors[key] || planColors.free };
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filteredProfiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm ? "Nenhum usuário encontrado para essa busca." : "Nenhum usuário cadastrado ainda."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProfiles.map((profile) => {
            const roles = userRoles[profile.id] || ["user"];
            const isSuspended = !!profile.suspended_at;
            const planInfo = getPlanDisplay(profile.subscription_plan);
            return (
              <Card key={profile.id} className={isSuspended ? "opacity-60 border-destructive/30" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {profile.full_name || "Sem nome"}
                          {isSuspended && <Badge variant="destructive" className="text-xs">Suspensa</Badge>}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" title="Ver detalhes" onClick={() => openDetailDialog(profile)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={isSuspended ? "Reativar conta" : "Suspender conta"}
                        onClick={() => handleSuspend(profile.id, isSuspended)}
                      >
                        <Ban className={`w-4 h-4 ${isSuspended ? "text-sozo-green" : "text-sozo-orange"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Excluir usuário" onClick={() => handleDeleteUser(profile.id, profile.full_name || "Sem nome")}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openPlanDialog(profile.id, profile.subscription_plan)}>
                        <CreditCard className="w-4 h-4 mr-1" /> Plano
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openAddRoleDialog(profile.id)}>
                        <Shield className="w-4 h-4 mr-1" /> Papel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-muted-foreground mr-1">Papéis:</span>
                    {roles.map((role) => (
                      <Badge
                        key={role}
                        className={`${roleColors[role] || "bg-muted text-muted-foreground"} cursor-pointer hover:opacity-80`}
                        onClick={() => handleRemoveRole(profile.id, role)}
                      >
                        {roleLabels[role] || role}
                        {role !== "user" && " ×"}
                      </Badge>
                    ))}
                    <span className="text-xs text-muted-foreground ml-3 mr-1">Plano:</span>
                    <Badge className={planInfo.color}>{planInfo.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Cadastrado em: {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Papel ao Usuário</DialogTitle>
            <DialogDescription>Papéis controlam permissões do sistema (ex: admin).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um papel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddRole}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano do Usuário</DialogTitle>
            <DialogDescription>O plano determina o acesso e dashboard do usuário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="enterprise">Empresarial</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSetPlan}>Salvar Plano</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações completas da conta</DialogDescription>
          </DialogHeader>
          {detailProfile && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong className="text-muted-foreground">Nome:</strong><p>{detailProfile.full_name || "—"}</p></div>
                <div><strong className="text-muted-foreground">E-mail:</strong><p>{detailProfile.email || "—"}</p></div>
                <div><strong className="text-muted-foreground">Telefone:</strong><p>{detailProfile.telefone || "—"}</p></div>
                <div><strong className="text-muted-foreground">Cadastro:</strong><p>{new Date(detailProfile.created_at).toLocaleDateString("pt-BR")}</p></div>
                <div><strong className="text-muted-foreground">Status:</strong><p>{detailProfile.suspended_at ? "Suspensa" : "Ativa"}</p></div>
                <div><strong className="text-muted-foreground">Testes realizados:</strong><p>{detailSubmissions}</p></div>
                <div><strong className="text-muted-foreground">Plano:</strong><p>{planLabels[detailProfile.subscription_plan || "free"] || "Gratuito"}</p></div>
              </div>
              <div>
                <strong className="text-muted-foreground text-sm">Papéis:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(userRoles[detailProfile.id] || ["user"]).map((r) => (
                    <Badge key={r} className={roleColors[r] || "bg-muted text-muted-foreground"}>{roleLabels[r] || r}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => handleSuspend(detailProfile.id, !!detailProfile.suspended_at)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {detailProfile.suspended_at ? "Reativar" : "Suspender"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteUser(detailProfile.id, detailProfile.full_name || "")}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir Permanentemente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
