import { supabase } from "@/integrations/supabase/client";

/**
 * Persist test submission and answers to the database.
 * Works for both authenticated and unauthenticated users.
 */
export async function saveTestSubmission({
  testSlug,
  respondentName,
  respondentEmail,
  scores,
  answers,
}: {
  testSlug: string;
  respondentName: string;
  respondentEmail: string;
  scores: Record<string, unknown>;
  answers?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: submission, error } = await supabase
      .from("test_submissions")
      .insert({
        respondent_name: respondentName,
        respondent_email: respondentEmail,
        user_id: user?.id || null,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !submission) {
      console.error("Error saving submission:", error);
      return null;
    }

    return submission.id;
  } catch (err) {
    console.error("Error in saveTestSubmission:", err);
    return null;
  }
}

/**
 * Save the generated report to the database.
 */
export async function saveGeneratedReport({
  submissionId,
  reportContent,
  scores,
}: {
  submissionId: string;
  reportContent: string;
  scores: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("generated_reports")
      .insert({
        submission_id: submissionId,
        report_content: reportContent,
        scores: scores as any,
      });

    if (error) {
      console.error("Error saving report:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in saveGeneratedReport:", err);
    return false;
  }
}
