import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Test {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  duration_minutes: number;
  is_active: boolean;
  price: number;
}

const categories = [
  "Comportamental",
  "Emocional",
  "Espiritual",
  "Identidade",
  "Temperamental",
  "Profissional",
];

export default function AdminTestes() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    description: "",
    long_description: "",
    category: "Comportamental",
    duration_minutes: 15,
    is_active: true,
    price: 0,
  });

  useEffect(() => {
    fetchTests();
  }, []);

  async function fetchTests() {
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar testes", variant: "destructive" });
    } else {
      setTests(data || []);
    }
    setIsLoading(false);
  }

  function openCreateDialog() {
    setEditingTest(null);
    setForm({
      slug: "",
      title: "",
      subtitle: "",
      description: "",
      long_description: "",
      category: "Comportamental",
      duration_minutes: 15,
      is_active: true,
      price: 0,
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(test: Test) {
    setEditingTest(test);
    setForm({
      slug: test.slug,
      title: test.title,
      subtitle: test.subtitle || "",
      description: test.description || "",
      long_description: "",
      category: test.category,
      duration_minutes: test.duration_minutes,
      is_active: test.is_active,
      price: test.price,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.slug || !form.title || !form.category) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (editingTest) {
      const { error } = await supabase
        .from("tests")
        .update(form)
        .eq("id", editingTest.id);

      if (error) {
        toast({ title: "Erro ao atualizar teste", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Teste atualizado com sucesso!" });
        setIsDialogOpen(false);
        fetchTests();
      }
    } else {
      const { error } = await supabase.from("tests").insert(form);

      if (error) {
        toast({ title: "Erro ao criar teste", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Teste criado com sucesso!" });
        setIsDialogOpen(false);
        fetchTests();
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este teste?")) return;

    const { error } = await supabase.from("tests").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir teste", variant: "destructive" });
    } else {
      toast({ title: "Teste excluído" });
      fetchTests();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Gerenciar Testes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Teste
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTest ? "Editar Teste" : "Criar Novo Teste"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, "-") })}
                    placeholder="disc"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Teste DISC"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Perfil Comportamental"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição curta</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descubra seu perfil comportamental..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long_description">Descrição completa</Label>
                <Textarea
                  id="long_description"
                  value={form.long_description}
                  onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                  placeholder="Descrição detalhada do teste..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 15 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>Teste ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTest ? "Salvar Alterações" : "Criar Teste"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum teste cadastrado ainda.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Teste
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{test.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${test.is_active ? "bg-sozo-green/10 text-sozo-green" : "bg-muted text-muted-foreground"}`}>
                      {test.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(test)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(test.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Categoria: {test.category}</span>
                  <span>Duração: {test.duration_minutes} min</span>
                  <span>Preço: R$ {test.price.toFixed(2)}</span>
                  <span>Slug: /{test.slug}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
