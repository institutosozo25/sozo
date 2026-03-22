import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTestAccess } from "./useTestAccess";
import { saveTestSubmission, saveGeneratedReport } from "@/lib/test-persistence";
import { toast } from "sonner";

interface UseTestPaywallOptions {
  testSlug: string;
  respondentName: string;
  respondentEmail: string;
  scores: Record<string, unknown>;
  generateReportFn: () => Promise<string | null>;
  onReportReady: (report: string) => void;
}

interface UseTestPaywallResult {
  /** Whether the user can generate for free (subscriber) */
  isFree: boolean;
  /** Whether auth/access is still loading */
  isLoading: boolean;
  /** Whether a payment/report operation is in progress */
  isProcessing: boolean;
  /** Whether payment dialog should show */
  showPaymentDialog: boolean;
  setShowPaymentDialog: (v: boolean) => void;
  /** Asaas invoice URL */
  invoiceUrl: string | null;
  /** The saved submission ID */
  submissionId: string | null;
  /** Handle free unlock (for subscribers) */
  handleFreeUnlock: () => Promise<void>;
  /** Handle paid unlock (creates submission + payment) */
  handlePaidUnlock: () => Promise<void>;
  /** Check if submission was paid and generate report */
  checkAndGenerate: () => Promise<void>;
  /** Whether submission has been paid */
  isPaid: boolean;
}

export function useTestPaywall({
  testSlug,
  respondentName,
  respondentEmail,
  scores,
  generateReportFn,
  onReportReady,
}: UseTestPaywallOptions): UseTestPaywallResult {
  const { user } = useAuth();
  const { isFree, isLoading } = useTestAccess(testSlug);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  // Check sessionStorage for a pending submission from previous payment attempt
  useEffect(() => {
    const pendingKey = `pending_submission_${testSlug}`;
    const pending = sessionStorage.getItem(pendingKey);
    if (pending && user) {
      setSubmissionId(pending);
      // Check if it was paid
      supabase
        .from("test_submissions")
        .select("test_result_unlocked, paid")
        .eq("id", pending)
        .single()
        .then(({ data }) => {
          if (data?.paid || data?.test_result_unlocked) {
            setIsPaid(true);
          }
        });
    }
  }, [testSlug, user]);

  const handleFreeUnlock = useCallback(async () => {
    if (!user) {
      toast.error("Faça login para gerar seu relatório completo.");
      return;
    }

    setIsProcessing(true);
    try {
      const report = await generateReportFn();
      if (!report) throw new Error("Falha ao gerar relatório");

      onReportReady(report);

      // Save submission and report
      const subId = await saveTestSubmission({
        testSlug,
        respondentName,
        respondentEmail,
        scores,
      });

      if (subId) {
        await saveGeneratedReport({
          submissionId: subId,
          reportContent: report,
          scores,
        });
      }

      toast.success("Relatório gerado com sucesso!");
    } catch (err) {
      console.error("Error generating report:", err);
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [user, generateReportFn, onReportReady, testSlug, respondentName, respondentEmail, scores]);

  const handlePaidUnlock = useCallback(async () => {
    if (!user) {
      toast.error("Faça login para desbloquear seu relatório.");
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Save submission if not already saved
      let subId = submissionId;
      if (!subId) {
        subId = await saveTestSubmission({
          testSlug,
          respondentName,
          respondentEmail,
          scores,
        });

        if (!subId) throw new Error("Erro ao salvar submissão");
        setSubmissionId(subId);

        // Store in sessionStorage so we can check payment status later
        sessionStorage.setItem(`pending_submission_${testSlug}`, subId);
      }

      // Step 2: Create payment via Asaas
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { submissionId: subId },
      });

      if (error) throw error;

      if (data.alreadyPaid) {
        setIsPaid(true);
        toast.success("Pagamento já confirmado! Gerando relatório...");
        // Payment was already done, generate report
        await generateAfterPayment();
        return;
      }

      if (data.invoiceUrl) {
        setInvoiceUrl(data.invoiceUrl);
        setShowPaymentDialog(true);
      } else {
        throw new Error("Não foi possível gerar o link de pagamento.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      console.error("Payment error:", err);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [user, submissionId, testSlug, respondentName, respondentEmail, scores]);

  const generateAfterPayment = useCallback(async () => {
    setIsProcessing(true);
    try {
      const report = await generateReportFn();
      if (!report) throw new Error("Falha ao gerar relatório");

      onReportReady(report);

      // Save the report to the existing submission
      if (submissionId) {
        await saveGeneratedReport({
          submissionId,
          reportContent: report,
          scores,
        });
      }

      // Cleanup
      sessionStorage.removeItem(`pending_submission_${testSlug}`);
      toast.success("Relatório gerado com sucesso!");
    } catch (err) {
      console.error("Error generating report after payment:", err);
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }, [generateReportFn, onReportReady, submissionId, scores, testSlug]);

  const checkAndGenerate = useCallback(async () => {
    if (!submissionId) return;

    setIsProcessing(true);
    try {
      const { data } = await supabase
        .from("test_submissions")
        .select("test_result_unlocked, paid")
        .eq("id", submissionId)
        .single();

      if (data?.paid || data?.test_result_unlocked) {
        setIsPaid(true);
        await generateAfterPayment();
      } else {
        toast.info("Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente.");
      }
    } catch {
      toast.error("Erro ao verificar pagamento.");
    } finally {
      setIsProcessing(false);
    }
  }, [submissionId, generateAfterPayment]);

  return {
    isFree,
    isLoading,
    isProcessing,
    showPaymentDialog,
    setShowPaymentDialog,
    invoiceUrl,
    submissionId,
    handleFreeUnlock,
    handlePaidUnlock,
    checkAndGenerate,
    isPaid,
  };
}
