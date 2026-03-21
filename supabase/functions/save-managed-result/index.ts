import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { colaborador_id, empresa_id, profissional_id, test_type, scores, link_id } = await req.json();

    if (!colaborador_id || !test_type || !scores) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the owner (empresa or profissional) to use as user_id
    let ownerId: string | null = null;

    if (empresa_id) {
      const { data: empresa } = await supabase
        .from("empresas")
        .select("profile_id")
        .eq("id", empresa_id)
        .single();
      ownerId = empresa?.profile_id || null;
    } else if (profissional_id) {
      const { data: prof } = await supabase
        .from("profissionais")
        .select("profile_id")
        .eq("id", profissional_id)
        .single();
      ownerId = prof?.profile_id || null;
    }

    if (!ownerId) {
      return new Response(JSON.stringify({ error: "Owner not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get colaborador info
    const { data: colab } = await supabase
      .from("colaboradores")
      .select("nome")
      .eq("id", colaborador_id)
      .single();

    const colaboradorName = colab?.nome || "Colaborador";

    // Look up test in tests table
    const { data: testData } = await supabase
      .from("tests")
      .select("id")
      .eq("slug", test_type)
      .single();

    // Insert test submission
    const { data: submission, error: subError } = await supabase
      .from("test_submissions")
      .insert({
        test_id: testData?.id || null,
        user_id: ownerId,
        applied_by: ownerId,
        colaborador_id,
        respondent_name: colaboradorName,
        respondent_email: "managed@sozo.app",
        status: "completed",
        completed_at: new Date().toISOString(),
        paid: true,
        test_result_unlocked: true,
      })
      .select("id")
      .single();

    if (subError) {
      console.error("Submission insert error:", subError);
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save scores as generated report
    if (submission) {
      await supabase.from("generated_reports").insert({
        submission_id: submission.id,
        scores,
        report_content: null,
      });
    }

    // Insert test history entry
    await supabase.from("test_history").insert({
      user_id: ownerId,
      test_type,
      test_name: `${test_type.toUpperCase()} — ${colaboradorName}`,
      metadata: { colaborador_id, colaborador_name: colaboradorName, scores },
    });

    return new Response(JSON.stringify({ success: true, submission_id: submission?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
