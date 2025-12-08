import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Test {
  id: string;
  title: string;
}

interface ReportTemplate {
  id: string;
  test_id: string;
  template_name: string;
  system_prompt: string | null;
  output_format: string;
  is_active: boolean;
  tests?: { title: string };
}

export default function AdminRelatorios() {
  const [tests, setTests] = useState<Test[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    test_id: "",
    template_name: "",
    system_prompt: "",
    output_format: "html",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [testsRes, templatesRes] = await Promise.all([
      supabase.from("tests").select("id, title").order("title"),
      supabase.from("report_templates").select("*, tests(title)").order("created_at", { ascending: false }),
    ]);

    setTests(testsRes.data || []);
    setTemplates(templatesRes.data || []);
    setIsLoading(false);
  }

  function openCreateDialog() {
    setEditingTemplate(null);
    setForm({
      test_id: "",
      template_name: "",
      system_prompt: "",
      output_format: "html",
      is_active: true,
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(template: ReportTemplate) {
    setEditingTemplate(template);
    setForm({
      test_id: template.test_id,
      template_name: template.template_name,
      system_prompt: template.system_prompt || "",
      output_format: template.output_format,
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.test_id || !form.template_name) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (editingTemplate) {
      const { error } = await supabase
        .from("report_templates")
        .update(form)
        .eq("id", editingTemplate.id);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Template atualizado!" });
        setIsDialogOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from("report_templates").insert(form);

      if (error) {
        toast({ title: "Erro ao criar", variant: "destructive" });
      } else {
        toast({ title: "Template criado!" });
        setIsDialogOpen(false);
        fetchData();
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este template de relatório?")) return;

    const { error } = await supabase.from("report_templates").delete().eq("id", id);

    if (!error) {
      toast({ title: "Template excluído" });
      fetchData();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Templates de Relatório</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum template de relatório cadastrado.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Teste: {template.tests?.title || "Não definido"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${template.is_active ? "bg-sozo-green/10 text-sozo-green" : "bg-muted text-muted-foreground"}`}>
                      {template.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Formato: {template.output_format.toUpperCase()}</p>
                  {template.system_prompt && (
                    <p className="mt-2 line-clamp-2">Prompt: {template.system_prompt}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teste *</Label>
                <Select value={form.test_id} onValueChange={(v) => setForm({ ...form, test_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>{test.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome do template *</Label>
                <Input
                  value={form.template_name}
                  onChange={(e) => setForm({ ...form, template_name: e.target.value })}
                  placeholder="Template padrão"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>System Prompt (instruções para geração do relatório)</Label>
              <Textarea
                value={form.system_prompt}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                placeholder="Você é um especialista em análise comportamental. Gere um relatório detalhado com base nas respostas do usuário..."
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Este prompt será usado para gerar relatórios personalizados. Use variáveis como {"{nome}"}, {"{respostas}"}, {"{scores}"}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formato de saída</Label>
                <Select value={form.output_format} onValueChange={(v) => setForm({ ...form, output_format: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label>Template ativo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingTemplate ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
