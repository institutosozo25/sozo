import { supabase } from "@/integrations/supabase/client";
import { sanitizeString } from "@/lib/validation";

/**
 * Persist test submission to the database.
 * Validates and sanitizes all inputs before saving.
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

    const { data: submission, error } = await supabase
      .from("test_submissions")
      .insert({
        respondent_name: safeName,
        respondent_email: safeEmail,
        user_id: user?.id || null,
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
    // Validate submissionId is UUID-like
    if (!/^[0-9a-f-]{36}$/.test(submissionId)) {
      console.error("Invalid submission ID format");
      return false;
    }

    const { error } = await supabase
      .from("generated_reports")
      .insert({
        submission_id: submissionId,
        report_content: reportContent,
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
