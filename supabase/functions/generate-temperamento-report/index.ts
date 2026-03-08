import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://sozo.lovable.app",
  "https://id-preview--b9bd0d97-1bb0-4a10-a384-515f12049013.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

async function authenticateRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", userId: null };
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: "Unauthorized", userId: null };
  return { error: null, userId: user.id };
}

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

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { error: authError, userId } = await authenticateRequest(req);
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: "Acesso não autorizado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const respondentName = String(body.respondentName || "Participante").slice(0, 200).replace(/[<>"'&]/g, "");
    const scores = body.scores;
    const percentages = body.percentages;
    const primary = String(body.primary || "").slice(0, 50);
    const secondary = String(body.secondary || "").slice(0, 50);
    const primaryLabel = String(body.primaryLabel || "").slice(0, 100);
    const secondaryLabel = String(body.secondaryLabel || "").slice(0, 100);

    if (!scores || typeof scores !== "object") {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Gere um relatório de perfil temperamental completo para:

Nome: ${respondentName}

Pontuações:
- Sanguíneo: ${scores.sanguineo} respostas (${percentages.sanguineo}%)
- Fleumático: ${scores.fleumatico} respostas (${percentages.fleumatico}%)
- Melancólico: ${scores.melancolico} respostas (${percentages.melancolico}%)
- Colérico: ${scores.colerico} respostas (${percentages.colerico}%)

Predominante: ${primaryLabel} (${primary})
Secundário: ${secondaryLabel} (${secondary})

Gere o relatório completo. Seja profundo e personalizado para ${primaryLabel} e ${secondaryLabel}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao gerar relatório. Tente novamente." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-temperamento-report error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
