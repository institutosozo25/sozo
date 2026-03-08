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

    const { scores, percentages, dominant, dominantName, wing, wingName, top3, respondentName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = respondentName || "Participante";
    const scoresText = Object.entries(scores as Record<string, number>)
      .map(([type, score]) => `- Tipo ${type}: ${score} pontos (${(percentages as Record<string, number>)[type]}%)`)
      .join("\n");
    const top3Text = (top3 as { type: number; name: string; percentage: number }[])
      .map((t, i) => `${i + 1}º Tipo ${t.type} — ${t.name} (${t.percentage}%)`)
      .join("\n");

    const userPrompt = `Gere um relatório completo do Eneagrama para:

Nome: ${name}

Pontuações:
${scoresText}

Tipo Dominante: Tipo ${dominant} — ${dominantName}
Asa: Tipo ${wing} — ${wingName}

Top 3:
${top3Text}

Gere o relatório para Tipo ${dominant} com asa ${wing} (${dominant}w${wing}).`;

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
        max_tokens: 10000,
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
    console.error("generate-eneagrama-report error:", e);
    return new Response(JSON.stringify({ error: "Erro interno. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
