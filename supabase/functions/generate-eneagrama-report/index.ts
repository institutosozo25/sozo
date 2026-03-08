import {
  getCorsHeaders, authenticateRequest, checkUserRateLimit, checkIpRateLimit,
  checkDailyReportLimit, checkDuplicateReport, logAuditEvent,
  sanitizeInput, sanitizeScores, errorResponse, jsonResponse,
} from "../_shared/security.ts";

const SYSTEM_PROMPT = `Você é um especialista em psicologia da personalidade, Eneagrama e desenvolvimento humano, com profundo conhecimento na aplicação terapêutica do Eneagrama.

Sua tarefa é gerar um relatório personalizado, profundo, terapêutico e profissional sobre o tipo do Eneagrama identificado.

O relatório DEVE seguir EXATAMENTE esta estrutura:

# Relatório do Eneagrama

## Resultado do Eneagrama
Apresente o tipo dominante, a asa identificada e o Top 3 de tipos predominantes com percentuais.

## Descrição da Personalidade
Explicação profunda da personalidade baseada no tipo identificado.

## Motivações Profundas
O que move essa personalidade, desejos internos e necessidades emocionais.

## Medos Principais
Medos centrais que influenciam o comportamento.

## Pontos Fortes
Principais forças psicológicas (mínimo 6).

## Desafios Emocionais
Padrões que podem gerar conflitos e autossabotagem.

## Influência da Asa
Como a asa influencia a personalidade. Compare as duas asas possíveis.

## Padrões de Comportamento
No trabalho, relacionamentos, estresse e liderança.

## Perfil em Relacionamentos
Comunicação afetiva, reação a conflitos no amor.

## Perfil Profissional
Estilo de trabalho, ambientes ideais, funções compatíveis.

## Caminho de Desenvolvimento
Práticas concretas para evolução pessoal.

## Conclusão
Mensagem inspiradora sobre o potencial natural do tipo.

REGRAS:
- Mínimo 2500 palavras
- Escreva em português brasileiro
- Use markdown para formatação
- Inclua a nota: "O Eneagrama indica tendências naturais de personalidade. Este resultado não constitui diagnóstico psicológico definitivo."
- NÃO mencione inteligência artificial
- Evite rótulos negativos — estimule crescimento pessoal`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!checkIpRateLimit(req)) return errorResponse(corsHeaders, 429, "Muitas requisições. Tente novamente em instantes.");

    const { error: authError, userId } = await authenticateRequest(req);
    if (authError || !userId) return errorResponse(corsHeaders, 401, "Acesso não autorizado.");

    if (!checkUserRateLimit(userId)) return errorResponse(corsHeaders, 429, "Limite de requisições excedido.");
    if (!(await checkDailyReportLimit(userId))) return errorResponse(corsHeaders, 429, "Limite diário de relatórios atingido (5/dia).");

    const body = await req.json();
    const respondentName = sanitizeInput(body.respondentName, 200) || "Participante";
    const scores = sanitizeScores(body.scores);
    const percentages = sanitizeScores(body.percentages);
    const dominant = sanitizeInput(body.dominant, 10);
    const dominantName = sanitizeInput(body.dominantName, 100);
    const wing = sanitizeInput(body.wing, 10);
    const wingName = sanitizeInput(body.wingName, 100);
    const top3 = Array.isArray(body.top3) ? body.top3.slice(0, 3) : [];
    const submissionId = sanitizeInput(body.submissionId, 36);

    if (!scores || !dominant) return errorResponse(corsHeaders, 400, "Dados inválidos.");

    if (submissionId) {
      const cached = await checkDuplicateReport(submissionId);
      if (cached) return jsonResponse(corsHeaders, { report: cached, cached: true });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return errorResponse(corsHeaders, 503, "Serviço temporariamente indisponível.");
    }

    const scoresText = Object.entries(scores)
      .map(([type, score]) => `- Tipo ${type}: ${score} pontos (${(percentages as Record<string, number> | null)?.[type] || 0}%)`)
      .join("\n");
    const top3Text = (top3 as { type: number; name: string; percentage: number }[])
      .map((t, i) => `${i + 1}º Tipo ${sanitizeInput(String(t.type), 10)} — ${sanitizeInput(t.name, 100)} (${Number(t.percentage) || 0}%)`)
      .join("\n");

    const userPrompt = `Gere um relatório completo do Eneagrama para:

Nome: ${respondentName}

Pontuações:
${scoresText}

Tipo Dominante: Tipo ${dominant} — ${dominantName}
Asa: Tipo ${wing} — ${wingName}

Top 3:
${top3Text}

Gere o relatório para Tipo ${dominant} com asa ${wing} (${dominant}w${wing}).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        max_tokens: 10000,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return errorResponse(corsHeaders, response.status === 429 ? 429 : 502,
        response.status === 429 ? "Limite de requisições excedido." : "Erro ao gerar relatório. Tente novamente.");
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";

    await logAuditEvent(userId, "report_generated", "eneagrama_report", submissionId || undefined, { test: "eneagrama" });

    return jsonResponse(corsHeaders, { report });
  } catch (e) {
    console.error("generate-eneagrama-report error:", e);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});
