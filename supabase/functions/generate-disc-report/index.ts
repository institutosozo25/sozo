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

// Simple in-memory rate limiter (per-isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW = 60_000; // per minute

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
  if (error || !user) {
    return { error: "Unauthorized", userId: null };
  }

  return { error: null, userId: user.id };
}

const SYSTEM_PROMPT = `Você é um especialista em análise comportamental DISC, desenvolvimento humano e avaliação de perfil psicológico.

Sua função é gerar relatórios comportamentais DISC completos, profissionais e profundos.

O relatório DEVE seguir EXATAMENTE esta estrutura:

# Relatório Comportamental DISC
## Perfil [Primário] (Primário) e [Secundário] (Secundário)

Escreva uma introdução profunda (3-4 parágrafos) analisando a combinação dos dois perfis comportamentais.

# Pontos Fortes
Liste e explique detalhadamente pelo menos 6 pontos fortes do perfil combinado. Cada ponto forte deve ter título e explicação de 2-3 frases.

# Fraquezas e Desafios
Explique pelo menos 5 dificuldades comportamentais com título e detalhamento.

# Motivações
Explique o que motiva esse perfil (mínimo 4 motivações detalhadas).

# Valores Fundamentais
Descreva os valores comportamentais mais comuns (mínimo 4 valores com explicação).

# Funcionamento nos Relacionamentos
## Relacionamentos Pessoais
Análise detalhada de como o perfil se comporta em relacionamentos pessoais (2-3 parágrafos).

## Relacionamentos Profissionais
Análise detalhada de como o perfil se comporta em relacionamentos profissionais (2-3 parágrafos).

# Funcionamento no Trabalho
## Execução de Tarefas
Como aborda e executa tarefas.

## Estilo de Liderança
Como lidera e gerencia.

## Trabalho em Equipe
Como se comporta em equipes.

# Funcionamento na Carreira
## Crescimento Profissional
Como progride na carreira.

## Ambições
Quais são as ambições típicas.

## Áreas de Destaque
Áreas profissionais onde esse perfil se destaca.

# Funcionamento no Dia a Dia
Rotina, organização, decisões e estilo de vida (2-3 parágrafos).

# Perfil Adaptado
Como a pessoa pode adaptar seu comportamento em diferentes contextos (2-3 parágrafos).

# Plano de Ação
Crie um plano de desenvolvimento com pelo menos 5 recomendações práticas numeradas, cada uma com título e descrição detalhada.

REGRAS:
- O relatório deve ser PROFUNDO, PROFISSIONAL, MOTIVADOR, CLARO e ESTRUTURADO
- Mínimo 2000 palavras
- Use linguagem profissional de análise comportamental
- Personalize o relatório para o nome do respondente quando fornecido
- Escreva em português brasileiro
- Use markdown para formatação
- NÃO use linguagem genérica - seja específico para a combinação de perfis`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const { error: authError, userId } = await authenticateRequest(req);
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: "Acesso não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const respondentName = String(body.respondentName || "Participante").slice(0, 200).replace(/[<>"'&]/g, "");
    const scores = body.scores;
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
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Gere um relatório comportamental DISC completo para a seguinte pessoa:

Nome: ${respondentName || "Participante"}

Pontuações DISC:
- Dominante (D): ${scores.D}
- Influente (I): ${scores.I}
- Estável (S): ${scores.S}
- Conforme (C): ${scores.C}

Perfil Primário: ${primaryLabel} (${primary})
Perfil Secundário: ${secondaryLabel} (${secondary})

Gere o relatório completo seguindo a estrutura definida. Seja profundo, profissional e personalizado para esta combinação específica de perfis ${primaryLabel} e ${secondaryLabel}.`;

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
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
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
    console.error("generate-disc-report error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
