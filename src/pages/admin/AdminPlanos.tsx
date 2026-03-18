import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, CreditCard, User } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
}

const planLabels: Record<string, string> = {
  free: "Gratuito",
  individual: "Individual",
  professional: "Profissional",
  enterprise: "Empresarial",
};

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  individual: "bg-secondary text-secondary-foreground",
  professional: "bg-primary text-primary-foreground",
  enterprise: "bg-accent text-accent-foreground",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  expired: "Expirado",
};

export default function AdminPlanos() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, subscription_plan, subscription_status")
      .order("created_at", { ascending: false });
    setProfiles((data as Profile[]) || []);
    setIsLoading(false);
  }

  function openDialog(profile: Profile) {
    setSelectedProfile(profile);
    setSelectedPlan(profile.subscription_plan || "");
    setSelectedStatus(profile.subscription_status || "active");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!selectedProfile || !selectedPlan) {
      toast({ title: "Selecione um plano", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.rpc("admin_set_user_plan", {
      _target_user_id: selectedProfile.id,
      _plan: selectedPlan,
      _status: selectedStatus,
    });
    setIsSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar plano", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plano atualizado com sucesso!" });
      setDialogOpen(false);
      fetchProfiles();
    }
  }

  const filtered = profiles.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(term) ||
      (p.email || "").toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Gerenciar Planos de Usuário</h1>
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((profile) => (
            <Card key={profile.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{profile.full_name || "Sem nome"}</CardTitle>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {profile.subscription_plan ? (
                        <Badge className={planColors[profile.subscription_plan] || "bg-muted text-muted-foreground"}>
                          {planLabels[profile.subscription_plan] || profile.subscription_plan}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Sem plano</Badge>
                      )}
                      <Badge variant={profile.subscription_status === "active" ? "default" : "secondary"}>
                        {statusLabels[profile.subscription_status || "inactive"] || profile.subscription_status}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openDialog(profile)}>
                      <CreditCard className="w-4 h-4 mr-1" /> Alterar Plano
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Plano — {selectedProfile?.full_name || selectedProfile?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Plano</label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="profissional">Profissional</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedProfile?.subscription_plan && (
              <p className="text-xs text-muted-foreground">
                Plano atual: <strong>{planLabels[selectedProfile.subscription_plan] || selectedProfile.subscription_plan}</strong> ({statusLabels[selectedProfile.subscription_status || "inactive"]})
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Plano"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
