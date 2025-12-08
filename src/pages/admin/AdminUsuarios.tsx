import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, User } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  professional: "Profissional",
  company: "Empresa",
  reseller: "Revendedor",
  user: "Usuário",
};

const roleColors: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  professional: "bg-secondary text-secondary-foreground",
  company: "bg-accent text-accent-foreground",
  reseller: "bg-sozo-orange text-white",
  user: "bg-muted text-muted-foreground",
};

export default function AdminUsuarios() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    setProfiles(profilesRes.data || []);

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
    setIsDialogOpen(true);
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
      .insert({ user_id: selectedUserId, role: selectedRole as "admin" | "professional" | "company" | "reseller" | "user" });

    if (error) {
      toast({ title: "Erro ao adicionar papel", variant: "destructive" });
    } else {
      toast({ title: "Papel adicionado!" });
      setIsDialogOpen(false);
      fetchData();
    }
  }

  async function handleRemoveRole(userId: string, role: string) {
    if (role === "user") {
      toast({ title: "Não é possível remover o papel de usuário básico", variant: "destructive" });
      return;
    }

    if (!confirm(`Remover papel "${roleLabels[role]}" deste usuário?`)) return;

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum usuário cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => {
            const roles = userRoles[profile.id] || ["user"];
            return (
              <Card key={profile.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {profile.full_name || "Sem nome"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openAddRoleDialog(profile.id)}>
                      <Shield className="w-4 h-4 mr-2" />
                      Adicionar Papel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Badge
                        key={role}
                        className={`${roleColors[role]} cursor-pointer hover:opacity-80`}
                        onClick={() => handleRemoveRole(profile.id, role)}
                      >
                        {roleLabels[role]}
                        {role !== "user" && " ×"}
                      </Badge>
                    ))}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Papel ao Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um papel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="reseller">Revendedor</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddRole}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
