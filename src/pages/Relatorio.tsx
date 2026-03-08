import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import DOMPurify from "dompurify";

interface ReportData {
  id: string;
  report_content: string | null;
  scores: Record<string, unknown> | null;
  created_at: string;
  submission: {
    respondent_name: string;
    respondent_email: string;
    completed_at: string | null;
  } | null;
}

export default function Relatorio() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user && id) {
      fetchReport();
    } else if (!authLoading && !user) {
      setError("Faça login para visualizar o relatório.");
      setLoading(false);
    }
  }, [id, user, authLoading]);

  const fetchReport = async () => {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from("generated_reports")
      .select("id, report_content, scores, created_at, submission:test_submissions!inner(respondent_name, respondent_email, completed_at)")
      .eq("id", id!)
      .single();

    if (fetchErr || !data) {
      setError("Relatório não encontrado ou sem permissão de acesso.");
    } else {
      const sub = Array.isArray(data.submission) ? data.submission[0] : data.submission;
      setReport({
        ...data,
        scores: data.scores as Record<string, unknown> | null,
        submission: sub as ReportData["submission"],
      });
    }
    setLoading(false);
  };

  const sanitizedContent = report?.report_content
    ? DOMPurify.sanitize(report.report_content, { ALLOWED_TAGS: ["h1","h2","h3","h4","h5","h6","p","br","ul","ol","li","strong","em","span","div","table","thead","tbody","tr","th","td","hr","blockquote"], ALLOWED_ATTR: ["class","style"] })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Header />
      </div>

      <section className="pt-28 pb-20 print:pt-4">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild variant="outline"><Link to="/auth">Fazer login</Link></Button>
            </div>
          ) : report ? (
            <>
              {/* Header bar - hidden in print */}
              <div className="flex items-center justify-between mb-8 print:hidden">
                <Button variant="ghost" asChild>
                  <Link to="/dashboard/usuario"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Link>
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Imprimir
                </Button>
              </div>

              {/* Report meta */}
              <div className="mb-8 p-6 rounded-2xl bg-card border border-border print:border-0 print:p-0">
                <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
                  Relatório — {report.submission?.respondent_name}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gerado em {new Date(report.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>

              {/* Report content */}
              <div
                className="prose prose-sm max-w-none bg-card rounded-2xl border border-border p-8 print:border-0 print:shadow-none print:p-0
                  prose-headings:font-heading prose-headings:text-foreground
                  prose-p:text-foreground prose-strong:text-foreground
                  prose-li:text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </>
          ) : null}
        </div>
      </section>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
