import {
  getCorsHeaders, authenticateRequest, checkUserRateLimit, checkIpRateLimit,
  sanitizeInput, errorResponse, jsonResponse,
} from "../_shared/security.ts";

const SYSTEM_PROMPT = `Você é um especialista em psicologia organizacional, saúde ocupacional e conformidade com a NR-1 (Norma Regulamentadora nº 1 — Gerenciamento de Riscos Ocupacionais).

Sua função é enriquecer relatórios de avaliação de riscos psicossociais com análises profundas, personalizadas e tecnicamente fundamentadas.

Você receberá dados de uma avaliação MAPSO (Modelo de Avaliação e Gestão de Riscos Psicossociais Organizacionais) contendo:
- Nome da empresa, setor e departamento
- Índice de Risco Psicossocial (IRP) e classificação
- Scores por dimensão (8 dimensões)
- Plano de ação existente

Você deve gerar TRÊS seções enriquecidas em formato HTML inline (sem tags <html>, <head>, <body>):

## SEÇÃO 1: analise_critica
Análise crítica profunda (mínimo 800 palavras) contendo:
- Contextualização do cenário organizacional
- Análise cruzada entre dimensões (como uma dimensão impacta outra)
- Fundamentação em modelos teóricos (Karasek, Siegrist, Maslach)
- Identificação de padrões sistêmicos
- Riscos de cascata organizacional
- Impacto potencial na produtividade e turnover

## SEÇÃO 2: recomendacoes_tecnicas
Recomendações técnicas detalhadas (mínimo 600 palavras):
- Para cada dimensão de risco alto/crítico, forneça 3-4 intervenções específicas
- Inclua indicadores de acompanhamento (KPIs) para cada ação
- Sugira cronograma realista de implementação
- Considere custo-benefício das intervenções
- Referencie boas práticas do mercado

## SEÇÃO 3: parecer_tecnico
Parecer técnico conclusivo (mínimo 400 palavras):
- Resumo executivo para a diretoria
- Enquadramento legal (NR-1, NR-17, CLT)
- Nível de urgência da intervenção
- Consequências da inação
- Próximos passos recomendados

REGRAS:
- Escreva em português brasileiro formal/técnico
- Use HTML inline para formatação (h3, p, ul, li, strong, etc.)
- NÃO mencione inteligência artificial em nenhum momento
- Apresente-se como análise do Instituto Plenitude SOZO
- Seja específico para o setor da empresa
- Use dados quantitativos quando possível

Retorne EXATAMENTE um JSON com as 3 chaves: analise_critica, recomendacoes_tecnicas, parecer_tecnico. Cada valor é uma string HTML.`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!checkIpRateLimit(req)) return errorResponse(corsHeaders, 429, "Muitas requisições.");

    const { error: authError, userId } = await authenticateRequest(req);
    if (authError || !userId) return errorResponse(corsHeaders, 401, "Acesso não autorizado.");

    if (!checkUserRateLimit(userId)) return errorResponse(corsHeaders, 429, "Limite de requisições excedido.");

    const body = await req.json();
    const organizationName = sanitizeInput(body.organizationName, 200) || "Empresa";
    const sector = sanitizeInput(body.sector, 100) || "Geral";
    const department = sanitizeInput(body.department, 100) || "";
    const irp = Number(body.irp) || 0;
    const irpClassification = sanitizeInput(body.irpClassification, 50) || "";
    const ipp = Number(body.ipp) || 0;
    const ivo = Number(body.ivo) || 0;
    const dimensions = Array.isArray(body.dimensions) ? body.dimensions : [];
    const actionPlan = Array.isArray(body.actionPlan) ? body.actionPlan : [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return errorResponse(corsHeaders, 503, "Serviço temporariamente indisponível.");
    }

    const dimText = dimensions
      .map((d: any) => `- ${d.name || d.id}: Score ${d.score || 0} — ${d.classification || "N/A"}`)
      .join("\n");

    const planText = actionPlan
      .map((a: any, i: number) => `${i + 1}. [${a.priority || ""}] ${a.riskFactor || ""}: ${a.recommendedAction || ""}`)
      .join("\n");

    const userPrompt = `Enriqueça o relatório MAPSO com análise profunda para:

Empresa: ${organizationName}
Setor: ${sector}
${department ? `Departamento: ${department}` : ""}
IRP: ${irp}/100 — Classificação: ${irpClassification}
IPP: ${ipp}/100
IVO: ${ivo}/8 dimensões vulneráveis

Dimensões:
${dimText}

Plano de Ação Atual:
${planText}

Gere as 3 seções (analise_critica, recomendacoes_tecnicas, parecer_tecnico) em JSON.`;

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
        response.status === 429 ? "Limite de requisições excedido." : "Erro ao gerar análise.");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (may be wrapped in ```json ... ```)
    let parsed: any = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse AI response as JSON, returning raw sections");
      parsed = { analise_critica: raw, recomendacoes_tecnicas: "", parecer_tecnico: "" };
    }

    return jsonResponse(corsHeaders, {
      analise_critica: parsed.analise_critica || "",
      recomendacoes_tecnicas: parsed.recomendacoes_tecnicas || "",
      parecer_tecnico: parsed.parecer_tecnico || "",
    });
  } catch (e) {
    console.error("enrich-mapso-report error:", e);
    return errorResponse(corsHeaders, 500, "Erro interno. Tente novamente.");
  }
});
