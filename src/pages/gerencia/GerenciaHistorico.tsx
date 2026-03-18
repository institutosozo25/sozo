import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { History, Download, FileText, Calendar } from "lucide-react";

interface TestHistoryItem {
  id: string;
  test_type: string;
  test_name: string;
  completed_at: string;
  pdf_diagnostic_path: string | null;
  pdf_report_path: string | null;
  pdf_action_plan_path: string | null;
}

export default function GerenciaHistorico() {
  const { user } = useAuth();
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("test_history")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (data) setHistory(data as TestHistoryItem[]);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const downloadPdf = async (path: string, filename: string) => {
    const { data, error } = await supabase.storage.from("test-pdfs").download(path);
    if (error || !data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const testTypeColors: Record<string, string> = {
    disc: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    mbti: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    temperamento: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    eneagrama: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    mapso: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <History className="w-8 h-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Histórico de Testes</h1>
          <p className="text-muted-foreground">Todos os testes realizados com PDFs disponíveis para download.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum teste no histórico</h3>
            <p className="text-muted-foreground text-sm">
              Quando você completar testes, eles aparecerão aqui com os PDFs para download.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id} className="hover:shadow-sozo-md transition-shadow">
              <CardContent className="py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{item.test_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${testTypeColors[item.test_type] || "bg-muted text-muted-foreground"}`}>
                          {item.test_type.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(item.completed_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.pdf_diagnostic_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPdf(item.pdf_diagnostic_path!, `diagnostico-${item.test_type}.pdf`)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Diagnóstico
                      </Button>
                    )}
                    {item.pdf_report_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPdf(item.pdf_report_path!, `relatorio-${item.test_type}.pdf`)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Relatório
                      </Button>
                    )}
                    {item.pdf_action_plan_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPdf(item.pdf_action_plan_path!, `plano-acao-${item.test_type}.pdf`)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Plano de Ação
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
