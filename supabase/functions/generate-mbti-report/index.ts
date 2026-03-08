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
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const respondentName = String(body.respondentName || "Participante").slice(0, 200).replace(/[<>"'&]/g, "");
    const scores = body.scores;
    const type = String(body.type || "").slice(0, 10);
    const typeName = String(body.typeName || "").slice(0, 100);
    const percentages = body.percentages;

    if (!scores || typeof scores !== "object" || !type) {
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

    const userPrompt = `Gere um relatório de personalidade MBTI completo para:

Nome: ${respondentName || "Participante"}
Tipo: ${type} — ${typeName}

Percentuais:
- E: ${percentages.E}% vs I: ${percentages.I}%
- S: ${percentages.S}% vs N: ${percentages.N}%
- T: ${percentages.T}% vs F: ${percentages.F}%
- J: ${percentages.J}% vs P: ${percentages.P}%

Gere o relatório completo seguindo a estrutura definida. Seja profundo e personalizado para o tipo ${type}.`;

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
        max_tokens: 12000,
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
    console.error("generate-mbti-report error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
