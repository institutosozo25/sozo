import { supabase } from "@/integrations/supabase/client";
import { sanitizeString } from "@/lib/validation";

/**
 * Persist test submission to the database.
 * REQUIRES authenticated user — will fail silently if not logged in.
 */
export async function saveTestSubmission({
  testSlug,
  respondentName,
  respondentEmail,
  scores,
}: {
  testSlug: string;
  respondentName: string;
  respondentEmail: string;
  scores: Record<string, unknown>;
  answers?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const safeName = sanitizeString(respondentName, 200);
    const safeEmail = sanitizeString(respondentEmail, 255);

    if (!safeName || !safeEmail) {
      console.error("Invalid submission data: missing name or email");
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Cannot save submission: user not authenticated");
      return null;
    }

    const { data: submission, error } = await supabase
      .from("test_submissions")
      .insert({
        respondent_name: safeName,
        respondent_email: safeEmail,
        user_id: user.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !submission) {
      console.error("Error saving submission:", error?.message);
      return null;
    }

    return submission.id;
  } catch {
    console.error("Error in saveTestSubmission");
    return null;
  }
}

/**
 * Save the generated report to the database.
 * Requires authenticated user with matching submission ownership.
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
    if (!/^[0-9a-f-]{36}$/.test(submissionId)) {
      console.error("Invalid submission ID format");
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Cannot save report: user not authenticated");
      return false;
    }

    // Truncate report content to prevent abuse (max 100KB)
    const safeContent = typeof reportContent === "string" ? reportContent.slice(0, 100_000) : "";

    const { error } = await supabase
      .from("generated_reports")
      .insert({
        submission_id: submissionId,
        report_content: safeContent,
        scores: scores as any,
      });

    if (error) {
      console.error("Error saving report:", error?.message);
      return false;
    }

    return true;
  } catch {
    console.error("Error in saveGeneratedReport");
    return false;
  }
}
