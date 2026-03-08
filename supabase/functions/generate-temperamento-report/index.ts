import {
  getCorsHeaders, authenticateRequest, checkUserRateLimit, checkIpRateLimit,
  checkDailyReportLimit, checkDuplicateReport, logAuditEvent,
  sanitizeInput, sanitizeScores, errorResponse, jsonResponse,
} from "../_shared/security.ts";

const SYSTEM_PROMPT = `Você é um analista especialista em temperamentos humanos, psicologia comportamental e desenvolvimento pessoal.

Sua função é gerar relatórios completos, profissionais e profundos sobre perfis temperamentais.

O relatório DEVE seguir EXATAMENTE esta estrutura:

# Relatório de Perfil Temperamental

## Resultado do Perfil
Apresente as porcentagens de cada temperamento e explique o que esse equilíbrio significa.

## Interpretação do Perfil Dominante
Explique profundamente: forma de pensar, padrão emocional, estilo de comunicação, motivadores internos.

## Traços Psicológicos Principais
Liste os principais traços comportamentais com explicações detalhadas.

## Padrões Emocionais
Como reage ao estresse, frustração, como expressa emoções.

## Pontos Fortes Naturais
Talentos naturais com explicações detalhadas (mínimo 6).

## Possíveis Desafios Comportamentais
Tendências que podem gerar dificuldades (mínimo 5).

## Perfil em Relacionamentos
Como ama, comunica, reage a conflitos, constrói vínculos.

## Perfil Profissional
Estilo de trabalho, ambientes ideais, funções compatíveis, estilo de liderança.

## Perfil de Tomada de Decisão
Racional, emocional, estratégico, impulsivo ou cauteloso.

## Interpretação do Temperamento Secundário
Como o segundo temperamento influencia o comportamento.

## Dinâmica Entre os Temperamentos
Como os dois principais temperamentos interagem.

## Estratégias de Desenvolvimento Pessoal
Orientações práticas para crescimento.

## Plano de Evolução Pessoal
Pelo menos 5 práticas com título e descrição.

## Conclusão
Resumo inspirador sobre potencial natural.

REGRAS:
- Mínimo 2000 palavras
- Escreva em português brasileiro
- Use markdown para formatação
- Inclua a nota: "Os temperamentos indicam tendências naturais de comportamento e podem ser desenvolvidos ao longo da vida."
- NÃO mencione inteligência artificial
- Seja específico para a combinação de temperamentos`;

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
    const primary = sanitizeInput(body.primary, 50);
    const secondary = sanitizeInput(body.secondary, 50);
    const primaryLabel = sanitizeInput(body.primaryLabel, 100);
    const secondaryLabel = sanitizeInput(body.secondaryLabel, 100);
    const submissionId = sanitizeInput(body.submissionId, 36);

    if (!scores) return errorResponse(corsHeaders, 400, "Dados inválidos.");

    if (submissionId) {
      const cached = await checkDuplicateReport(submissionId);
      if (cached) return jsonResponse(corsHeaders, { report: cached, cached: true });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return errorResponse(corsHeaders, 503, "Serviço temporariamente indisponível.");
    }

    const userPrompt = `Gere um relatório de perfil temperamental completo para:

Nome: ${respondentName}

Pontuações:
- Sanguíneo: ${scores.sanguineo || 0} respostas (${percentages?.sanguineo || 0}%)
- Fleumático: ${scores.fleumatico || 0} respostas (${percentages?.fleumatico || 0}%)
- Melancólico: ${scores.melancolico || 0} respostas (${percentages?.melancolico || 0}%)
- Colérico: ${scores.colerico || 0} respostas (${percentages?.colerico || 0}%)

Predominante: ${primaryLabel} (${primary})
Secundário: ${secondaryLabel} (${secondary})

Gere o relatório completo. Seja profundo e personalizado para ${primaryLabel} e ${secondaryLabel}.`;

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
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return errorResponse(corsHeaders, response.status === 429 ? 429 : 502,
        response.status === 429 ? "Limite de requisições excedido." : "Erro ao gerar relatório. Tente novamente.");
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";

    await logAuditEvent(userId, "report_generated", "temperamento_report", submissionId || undefined, { test: "temperamento" });

    return jsonResponse(corsHeaders, { report });
  } catch (e) {
    console.error("generate-temperamento-report error:", e);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});
