import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import { Link } from "react-router-dom";

interface UsuarioTeste {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

export default function DashboardUsuario() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dados, setDados] = useState<UsuarioTeste | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });

  useEffect(() => {
    if (user) fetchDados();
  }, [user]);

  const fetchDados = async () => {
    const { data } = await supabase.from("usuarios_testes").select("*").eq("profile_id", user!.id).single();
    if (data) {
      setDados(data);
      setForm({ nome: data.nome || "", email: data.email || "", telefone: data.telefone || "" });
    }
  };

  const save = async () => {
    if (!dados) return;
    const { error } = await supabase.from("usuarios_testes").update({
      nome: form.nome, email: form.email, telefone: form.telefone,
    }).eq("id", dados.id);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Dados salvos!" });
      setEditMode(false);
      fetchDados();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <User className="w-8 h-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold text-foreground">Minha Conta</h1>
          </div>

          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Meus Dados</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? "Cancelar" : "Editar"}
              </Button>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-4">
                  <div className="space-y-1"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                  <div className="space-y-1"><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
                  <Button onClick={save}>Salvar</Button>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div><strong>Nome:</strong> {dados?.nome || "—"}</div>
                  <div><strong>E-mail:</strong> {dados?.email || "—"}</div>
                  <div><strong>Telefone:</strong> {dados?.telefone || "—"}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Testes Disponíveis</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Explore os testes disponíveis na plataforma.</p>
              <div className="flex gap-2">
                <Button asChild><Link to="/testes">Ver Testes</Link></Button>
                <Button variant="outline" asChild><Link to="/mapso">MAPSO</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
