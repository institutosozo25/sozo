import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Printer, ShieldAlert, LogIn, CloudUpload, Loader2, Check } from "lucide-react";
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

type PageState = "loading" | "unauthenticated" | "forbidden" | "success";

export default function Relatorio() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [report, setReport] = useState<ReportData | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPageState("unauthenticated");
      return;
    }
    if (id) fetchReport();
  }, [id, user, authLoading]);

  const fetchReport = async () => {
    setPageState("loading");
    const { data, error } = await supabase
      .from("generated_reports")
      .select("id, report_content, scores, created_at, submission:test_submissions!inner(respondent_name, respondent_email, completed_at)")
      .eq("id", id!)
      .maybeSingle();

    if (error || !data) {
      setPageState("forbidden");
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para visualizar este relatório.",
        variant: "destructive",
      });
      return;
    }

    const sub = Array.isArray(data.submission) ? data.submission[0] : data.submission;
    setReport({
      ...data,
      scores: data.scores as Record<string, unknown> | null,
      submission: sub as ReportData["submission"],
    });
    setPageState("success");

    // Audit log: record third-party report viewing
    try {
      await supabase.rpc("log_audit_event", {
        _action: "view_report",
        _entity_type: "generated_report",
        _entity_id: id!,
        _metadata: {},
      });
    } catch {
      // non-blocking
    }
  };

  const sanitizedContent = report?.report_content
    ? DOMPurify.sanitize(report.report_content, {
        ALLOWED_TAGS: ["h1","h2","h3","h4","h5","h6","p","br","ul","ol","li","strong","em","span","div","table","thead","tbody","tr","th","td","hr","blockquote"],
        ALLOWED_ATTR: ["class","style"],
      })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden"><Header /></div>

      <section className="pt-28 pb-20 print:pt-4">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">

          {/* Loading skeleton */}
          {pageState === "loading" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-6 w-1/3 mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          )}

          {/* Unauthenticated */}
          {pageState === "unauthenticated" && (
            <div className="text-center py-20 space-y-4">
              <LogIn className="w-14 h-14 text-muted-foreground mx-auto" />
              <h2 className="font-heading text-xl font-bold text-foreground">Faça login para continuar</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Você precisa estar autenticado para visualizar este relatório.
              </p>
              <Button asChild><Link to="/auth">Entrar</Link></Button>
            </div>
          )}

          {/* Forbidden / Not found (IDOR blocked by RLS) */}
          {pageState === "forbidden" && (
            <div className="text-center py-20 space-y-4">
              <ShieldAlert className="w-14 h-14 text-destructive mx-auto" />
              <h2 className="font-heading text-xl font-bold text-foreground">403 — Acesso Negado</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Você não tem permissão para visualizar este relatório, ou ele não existe.
              </p>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </div>
          )}

          {/* Report loaded */}
          {pageState === "success" && report && (
            <>
              <div className="flex items-center justify-between mb-8 print:hidden">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Salvar como PDF
                </Button>
              </div>

              <div className="mb-8 p-6 rounded-2xl bg-card border border-border print:border-0 print:p-0">
                <h1 className="font-heading text-2xl font-bold text-foreground mb-1">
                  Relatório — {report.submission?.respondent_name}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gerado em {new Date(report.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>

              <div
                className="prose prose-sm max-w-none bg-card rounded-2xl border border-border p-8 print:border-0 print:shadow-none print:p-0
                  prose-headings:font-heading prose-headings:text-foreground
                  prose-p:text-foreground prose-strong:text-foreground
                  prose-li:text-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </>
          )}
        </div>
      </section>

      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
