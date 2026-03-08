import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scores, primary, secondary, primaryLabel, secondaryLabel, respondentName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-disc-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
