import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";

interface Test {
  id: string;
  title: string;
}

interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_order: number;
  question_type: string;
}

interface AnswerOption {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
  weight: number;
  dimension: string | null;
}

export default function AdminPerguntas() {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Record<string, AnswerOption[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingOption, setEditingOption] = useState<AnswerOption | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  const { toast } = useToast();

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_order: 1,
    question_type: "single_choice",
  });

  const [optionForm, setOptionForm] = useState({
    option_text: "",
    option_order: 1,
    weight: 0,
    dimension: "",
  });

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions(selectedTestId);
    }
  }, [selectedTestId]);

  async function fetchTests() {
    const { data } = await supabase.from("tests").select("id, title").order("title");
    setTests(data || []);
    setIsLoading(false);
  }

  async function fetchQuestions(testId: string) {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("test_id", testId)
      .order("question_order");

    if (!error && data) {
      setQuestions(data);
      
      // Fetch options for all questions
      const questionIds = data.map((q) => q.id);
      if (questionIds.length > 0) {
        const { data: optionsData } = await supabase
          .from("answer_options")
          .select("*")
          .in("question_id", questionIds)
          .order("option_order");

        const grouped: Record<string, AnswerOption[]> = {};
        optionsData?.forEach((opt) => {
          if (!grouped[opt.question_id]) grouped[opt.question_id] = [];
          grouped[opt.question_id].push(opt);
        });
        setOptions(grouped);
      }
    }
    setIsLoading(false);
  }

  function openCreateQuestionDialog() {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: "",
      question_order: questions.length + 1,
      question_type: "single_choice",
    });
    setIsQuestionDialogOpen(true);
  }

  function openEditQuestionDialog(question: Question) {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_order: question.question_order,
      question_type: question.question_type,
    });
    setIsQuestionDialogOpen(true);
  }

  async function handleQuestionSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!questionForm.question_text) {
      toast({ title: "Preencha o texto da pergunta", variant: "destructive" });
      return;
    }

    if (editingQuestion) {
      const { error } = await supabase
        .from("questions")
        .update(questionForm)
        .eq("id", editingQuestion.id);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Pergunta atualizada!" });
        setIsQuestionDialogOpen(false);
        fetchQuestions(selectedTestId);
      }
    } else {
      const { error } = await supabase
        .from("questions")
        .insert({ ...questionForm, test_id: selectedTestId });

      if (error) {
        toast({ title: "Erro ao criar", variant: "destructive" });
      } else {
        toast({ title: "Pergunta criada!" });
        setIsQuestionDialogOpen(false);
        fetchQuestions(selectedTestId);
      }
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("Excluir esta pergunta e todas suas opções?")) return;

    const { error } = await supabase.from("questions").delete().eq("id", id);

    if (!error) {
      toast({ title: "Pergunta excluída" });
      fetchQuestions(selectedTestId);
    }
  }

  function openCreateOptionDialog(questionId: string) {
    setCurrentQuestionId(questionId);
    setEditingOption(null);
    const currentOptions = options[questionId] || [];
    setOptionForm({
      option_text: "",
      option_order: currentOptions.length + 1,
      weight: 0,
      dimension: "",
    });
    setIsOptionDialogOpen(true);
  }

  function openEditOptionDialog(option: AnswerOption) {
    setCurrentQuestionId(option.question_id);
    setEditingOption(option);
    setOptionForm({
      option_text: option.option_text,
      option_order: option.option_order,
      weight: option.weight,
      dimension: option.dimension || "",
    });
    setIsOptionDialogOpen(true);
  }

  async function handleOptionSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!optionForm.option_text) {
      toast({ title: "Preencha o texto da opção", variant: "destructive" });
      return;
    }

    if (editingOption) {
      const { error } = await supabase
        .from("answer_options")
        .update(optionForm)
        .eq("id", editingOption.id);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Opção atualizada!" });
        setIsOptionDialogOpen(false);
        fetchQuestions(selectedTestId);
      }
    } else {
      const { error } = await supabase
        .from("answer_options")
        .insert({ ...optionForm, question_id: currentQuestionId });

      if (error) {
        toast({ title: "Erro ao criar", variant: "destructive" });
      } else {
        toast({ title: "Opção criada!" });
        setIsOptionDialogOpen(false);
        fetchQuestions(selectedTestId);
      }
    }
  }

  async function handleDeleteOption(id: string) {
    if (!confirm("Excluir esta opção?")) return;

    const { error } = await supabase.from("answer_options").delete().eq("id", id);

    if (!error) {
      toast({ title: "Opção excluída" });
      fetchQuestions(selectedTestId);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Gerenciar Perguntas</h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Selecione um teste</Label>
              <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um teste..." />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((test) => (
                    <SelectItem key={test.id} value={test.id}>{test.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTestId && (
              <Button onClick={openCreateQuestionDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Pergunta
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedTestId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione um teste para gerenciar suas perguntas
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma pergunta cadastrada.</p>
            <Button onClick={openCreateQuestionDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Pergunta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {questions.map((question, idx) => (
            <AccordionItem key={question.id} value={question.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">{idx + 1}.</span>
                  <span className="font-medium">{question.question_text}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={() => openEditQuestionDialog(question)}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteQuestion(question.id)}>
                    <Trash2 className="w-3 h-3 mr-1 text-destructive" />
                    Excluir
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openCreateOptionDialog(question.id)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Nova Opção
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Opções de resposta:</p>
                  {(options[question.id] || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhuma opção cadastrada</p>
                  ) : (
                    <div className="space-y-2">
                      {(options[question.id] || []).map((opt) => (
                        <div key={opt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium">{opt.option_text}</p>
                            <p className="text-xs text-muted-foreground">
                              Peso: {opt.weight} {opt.dimension && `| Dimensão: ${opt.dimension}`}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditOptionDialog(opt)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteOption(opt.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuestionSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Texto da pergunta *</Label>
              <Textarea
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Digite a pergunta..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={questionForm.question_order}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_order: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={questionForm.question_type} onValueChange={(v) => setQuestionForm({ ...questionForm, question_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Escolha única</SelectItem>
                    <SelectItem value="multiple_choice">Múltipla escolha</SelectItem>
                    <SelectItem value="scale">Escala</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingQuestion ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOption ? "Editar Opção" : "Nova Opção"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOptionSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Texto da opção *</Label>
              <Input
                value={optionForm.option_text}
                onChange={(e) => setOptionForm({ ...optionForm, option_text: e.target.value })}
                placeholder="Digite a opção..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={optionForm.option_order}
                  onChange={(e) => setOptionForm({ ...optionForm, option_order: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Peso</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={optionForm.weight}
                  onChange={(e) => setOptionForm({ ...optionForm, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dimensão</Label>
                <Input
                  value={optionForm.dimension}
                  onChange={(e) => setOptionForm({ ...optionForm, dimension: e.target.value })}
                  placeholder="Ex: D, I, S, C"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOptionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingOption ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
