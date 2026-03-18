import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a PDF blob to Supabase Storage and save a test_history record.
 */
export async function saveTestToHistory({
  testType,
  testName,
  diagnosticBlob,
  reportBlob,
  actionPlanBlob,
}: {
  testType: string;
  testName: string;
  diagnosticBlob?: Blob | null;
  reportBlob?: Blob | null;
  actionPlanBlob?: Blob | null;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const timestamp = Date.now();
    const basePath = `${user.id}/${testType}-${timestamp}`;

    let diagnosticPath: string | null = null;
    let reportPath: string | null = null;
    let actionPlanPath: string | null = null;

    // Upload PDFs in parallel
    const uploads: Promise<void>[] = [];

    if (diagnosticBlob) {
      const path = `${basePath}/diagnostico.pdf`;
      uploads.push(
        supabase.storage.from("test-pdfs").upload(path, diagnosticBlob, { contentType: "application/pdf" })
          .then(({ error }) => { if (!error) diagnosticPath = path; })
      );
    }

    if (reportBlob) {
      const path = `${basePath}/relatorio.pdf`;
      uploads.push(
        supabase.storage.from("test-pdfs").upload(path, reportBlob, { contentType: "application/pdf" })
          .then(({ error }) => { if (!error) reportPath = path; })
      );
    }

    if (actionPlanBlob) {
      const path = `${basePath}/plano-acao.pdf`;
      uploads.push(
        supabase.storage.from("test-pdfs").upload(path, actionPlanBlob, { contentType: "application/pdf" })
          .then(({ error }) => { if (!error) actionPlanPath = path; })
      );
    }

    await Promise.all(uploads);

    // Save record to test_history
    const { error } = await supabase.from("test_history").insert({
      user_id: user.id,
      test_type: testType,
      test_name: testName,
      completed_at: new Date().toISOString(),
      pdf_diagnostic_path: diagnosticPath,
      pdf_report_path: reportPath,
      pdf_action_plan_path: actionPlanPath,
    });

    if (error) {
      console.error("Error saving test history:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in saveTestToHistory:", err);
    return false;
  }
}

/**
 * Generate a PDF blob from an HTML element using html2pdf.js
 */
export async function generatePdfBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const blob = await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: "report.pdf",
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .outputPdf("blob");
    return blob as Blob;
  } catch {
    console.error("Error generating PDF blob");
    return null;
  }
}
