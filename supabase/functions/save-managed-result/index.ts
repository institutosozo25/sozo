import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPORT_PROMPTS: Record<string, { system: string; buildUserPrompt: (name: string, scores: Record<string, unknown>) => string }> = {
  mbti: {
    system: `Você é um Especialista em Psicologia Analítica e MBTI. Gere relatórios completos, profissionais e profundos em português brasileiro. Mínimo 3000 palavras. Use markdown. NÃO mencione inteligência artificial. Estrutura: 1. Visão Geral, 2. Como Age no Mundo, 3. Pontos Fortes (8+), 4. Desafios (6+), 5. Sob Estresse, 6. Comunicação, 7. Relacionamentos, 8. Aprendizado, 9. Produtividade, 10. Carreira Ideal, 11. 20 Profissões, 12. Equipe, 13. Liderança, 14. Tomada de Decisão, 15. Desenvolvimento Pessoal (7+ recomendações).`,
    buildUserPrompt: (name, scores) => {
      const p = (scores.percentages as Record<string, number>) || {};
      return `Gere relatório MBTI completo para: ${name}, Tipo: ${scores.type} — ${scores.typeName}. Percentuais: E:${p.E||0}% I:${p.I||0}% S:${p.S||0}% N:${p.N||0}% T:${p.T||0}% F:${p.F||0}% J:${p.J||0}% P:${p.P||0}%.`;
    },
  },
  disc: {
    system: `Você é especialista em análise comportamental DISC. Gere relatórios completos e profundos em português brasileiro. Mínimo 2500 palavras. Use markdown. NÃO mencione inteligência artificial. Estrutura: Introdução, Pontos Fortes (6+), Fraquezas (5+), Motivações (4+), Valores (4+), Relacionamentos Pessoais/Profissionais, Trabalho (Tarefas/Liderança/Equipe), Carreira, Comunicação, Estresse, Desenvolvimento Pessoal.`,
    buildUserPrompt: (name, scores) => {
      const s = (scores.scores as Record<string, number>) || scores;
      return `Gere relatório DISC para: ${name}. Perfil Primário: ${scores.primaryLabel} (${scores.primary}), Secundário: ${scores.secondaryLabel} (${scores.secondary}). Scores - D:${s.D||0} I:${s.I||0} S:${s.S||0} C:${s.C||0}.`;
    },
  },
  temperamento: {
    system: `Você é analista especialista em temperamentos humanos. Gere relatórios completos e profundos em português brasileiro. Mínimo 2500 palavras. Use markdown. NÃO mencione inteligência artificial. Estrutura: Resultado do Perfil, Interpretação Dominante, Traços Psicológicos, Padrões Emocionais, Pontos Fortes (6+), Desafios (5+), Relacionamentos, Perfil Profissional, Tomada de Decisão, Temperamento Secundário, Dinâmica Entre Temperamentos, Desenvolvimento Pessoal.`,
    buildUserPrompt: (name, scores) => {
      const p = (scores.percentages as Record<string, number>) || {};
      return `Gere relatório de temperamento para: ${name}. Primário: ${scores.primaryLabel}, Secundário: ${scores.secondaryLabel}. Percentuais: Sanguíneo:${p.sanguineo||0}% Fleumático:${p.fleumatico||0}% Melancólico:${p.melancolico||0}% Colérico:${p.colerico||0}%.`;
    },
  },
  eneagrama: {
    system: `Você é especialista em Eneagrama e desenvolvimento humano. Gere relatórios completos, terapêuticos e profundos em português brasileiro. Mínimo 2500 palavras. Use markdown. NÃO mencione inteligência artificial. Estrutura: Resultado, Descrição da Personalidade, Motivações Profundas, Medos, Pontos Fortes (6+), Desafios Emocionais, Influência da Asa, Padrões de Comportamento, Relacionamentos, Perfil Profissional, Caminho de Desenvolvimento, Conclusão.`,
    buildUserPrompt: (name, scores) => {
      return `Gere relatório do Eneagrama para: ${name}. Tipo dominante: ${scores.dominant} (${scores.dominantName}). Asa: ${scores.wing}. Top3: ${JSON.stringify(scores.top3 || [])}.`;
    },
  },
};

async function generateAIReport(testType: string, respondentName: string, scores: Record<string, unknown>): Promise<string | null> {
  const prompt = REPORT_PROMPTS[testType];
  if (!prompt) return null;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.buildUserPrompt(respondentName, scores) },
        ],
        stream: false,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("AI report generation failed:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { colaborador_id, test_type, scores, link_id } = payload;
    let { empresa_id, profissional_id } = payload;

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

    if (!empresa_id && !profissional_id && link_id) {
      const { data: linkData, error: linkError } = await supabase
        .from("shared_test_links")
        .select("empresa_id, profissional_id, created_by")
        .eq("id", link_id)
        .maybeSingle();

      if (linkError) {
        console.error("Link lookup error:", linkError);
      }

      if (linkData) {
        empresa_id = linkData.empresa_id ?? empresa_id;
        profissional_id = linkData.profissional_id ?? profissional_id;
      }
    }

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

    if (!ownerId && link_id) {
      const { data: linkOwner } = await supabase
        .from("shared_test_links")
        .select("created_by")
        .eq("id", link_id)
        .maybeSingle();

      ownerId = linkOwner?.created_by || null;
    }

    if (!ownerId) {
      return new Response(JSON.stringify({ error: "Owner not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: colab } = await supabase
      .from("colaboradores")
      .select("nome")
      .eq("id", colaborador_id)
      .maybeSingle();

    const respondentName = colab?.nome || "Colaborador";

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
        respondent_name: respondentName,
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

    // Generate AI report
    console.log(`Generating AI report for ${test_type} - ${respondentName}...`);
    const reportContent = await generateAIReport(test_type, respondentName, scores);
    console.log(`AI report generated: ${reportContent ? 'success' : 'failed'} (${reportContent?.length || 0} chars)`);

    // Save scores and report to generated_reports
    if (submission) {
      await supabase.from("generated_reports").insert({
        submission_id: submission.id,
        scores,
        report_content: reportContent,
      });
    }

    // Insert test history entry with submission_id reference
    await supabase.from("test_history").insert({
      user_id: ownerId,
      test_type,
      test_name: `${test_type.toUpperCase()} — ${respondentName}`,
      metadata: {
        colaborador_id,
        colaborador_name: respondentName,
        scores,
        submission_id: submission?.id,
        has_report: !!reportContent,
        link_id,
      },
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
