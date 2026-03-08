import {
  getCorsHeaders, authenticateRequest, checkUserRateLimit, checkIpRateLimit,
  checkDailyReportLimit, checkDuplicateReport, logAuditEvent,
  sanitizeInput, sanitizeScores, errorResponse, jsonResponse,
} from "../_shared/security.ts";

const SYSTEM_PROMPT = `Você é um Especialista em Psicologia Analítica, Tipologia de Personalidade e Avaliação Comportamental baseado no modelo MBTI (Myers-Briggs Type Indicator).

Sua função é gerar relatórios de personalidade MBTI completos, profissionais, profundos e motivadores.

O relatório DEVE seguir EXATAMENTE esta estrutura:

# Relatório de Personalidade MBTI
## [TIPO] — [Nome do Tipo]

# 1. Visão Geral
Descrição inspiradora e profunda da personalidade (3-4 parágrafos).

# 2. Como Essa Personalidade Age no Mundo
Comportamentos naturais, forma de interagir com o ambiente (2-3 parágrafos).

# 3. Pontos Fortes Naturais
Liste e explique pelo menos 8 talentos e capacidades naturais.

# 4. Desafios e Pontos de Crescimento
Explique pelo menos 6 dificuldades e áreas de desenvolvimento.

# 5. Como Age Sob Estresse
Situações que geram tensão e reações típicas (2-3 parágrafos).

# 6. Comunicação
Estilo de comunicação verbal e não-verbal (2-3 parágrafos).

# 7. Relacionamentos
Como se conecta com outras pessoas (3-4 parágrafos).

# 8. Estilo de Aprendizado
Como aprende melhor (2 parágrafos).

# 9. Procrastinação e Produtividade
Padrões de produtividade (2 parágrafos).

# 10. Carreira Ideal
Ambientes profissionais ideais (2 parágrafos).

# 11. 20 Profissões Compatíveis
Liste 20 profissões com explicação breve.

# 12. Como Trabalha em Equipe
Papel natural em equipes (2 parágrafos).

# 13. Liderança
Estilo de liderança natural (2 parágrafos).

# 14. Tomada de Decisão
Processo natural de tomada de decisão (2 parágrafos).

# 15. Caminho de Desenvolvimento Pessoal
Plano prático com pelo menos 7 recomendações numeradas.

REGRAS:
- Mínimo 3000 palavras
- Escreva em português brasileiro
- Use markdown para formatação
- NÃO mencione inteligência artificial
- Seja específico para o tipo MBTI fornecido`;

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
    const type = sanitizeInput(body.type, 10);
    const typeName = sanitizeInput(body.typeName, 100);
    const percentages = sanitizeScores(body.percentages);
    const submissionId = sanitizeInput(body.submissionId, 36);

    if (!scores || !type) return errorResponse(corsHeaders, 400, "Dados inválidos.");

    if (submissionId) {
      const cached = await checkDuplicateReport(submissionId);
      if (cached) return jsonResponse(corsHeaders, { report: cached, cached: true });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return errorResponse(corsHeaders, 503, "Serviço temporariamente indisponível.");
    }

    const userPrompt = `Gere um relatório de personalidade MBTI completo para:

Nome: ${respondentName}
Tipo: ${type} — ${typeName}

Percentuais:
- E: ${percentages?.E || 0}% vs I: ${percentages?.I || 0}%
- S: ${percentages?.S || 0}% vs N: ${percentages?.N || 0}%
- T: ${percentages?.T || 0}% vs F: ${percentages?.F || 0}%
- J: ${percentages?.J || 0}% vs P: ${percentages?.P || 0}%

Gere o relatório completo seguindo a estrutura definida. Seja profundo e personalizado para o tipo ${type}.`;

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
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return errorResponse(corsHeaders, response.status === 429 ? 429 : 502,
        response.status === 429 ? "Limite de requisições excedido." : "Erro ao gerar relatório. Tente novamente.");
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";

    await logAuditEvent(userId, "report_generated", "mbti_report", submissionId || undefined, { test: "mbti" });

    return jsonResponse(corsHeaders, { report });
  } catch (e) {
    console.error("generate-mbti-report error:", e);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});
