import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um analista especialista em temperamentos humanos, psicologia comportamental e desenvolvimento pessoal.

Sua função é gerar relatórios completos, profissionais e profundos sobre perfis temperamentais.

O relatório DEVE seguir EXATAMENTE esta estrutura:

# Relatório de Perfil Temperamental

## Resultado do Perfil
Apresente as porcentagens de cada temperamento e explique o que esse equilíbrio significa.

## Interpretação do Perfil Dominante
Explique profundamente: forma de pensar, padrão emocional, estilo de comunicação, motivadores internos, forma de tomar decisões, comportamento social.

## Traços Psicológicos Principais
Liste os principais traços comportamentais do perfil predominante com explicações detalhadas.

## Padrões Emocionais
Explique: como reage ao estresse, como lida com frustração, como expressa emoções, como processa conflitos.

## Pontos Fortes Naturais
Liste talentos naturais com explicações detalhadas (mínimo 6).

## Possíveis Desafios Comportamentais
Explique tendências que podem gerar dificuldades (mínimo 5).

## Perfil em Relacionamentos
Explique: como ama, como se comunica, como reage a conflitos, como constrói vínculos.

## Perfil Profissional
Explique: estilo de trabalho, ambientes ideais, funções compatíveis, estilo de liderança.

## Perfil de Tomada de Decisão
Explique se tende a ser racional, emocional, estratégico, impulsivo ou cauteloso.

## Interpretação do Temperamento Secundário
Explique como o segundo temperamento influencia o comportamento.

## Dinâmica Entre os Temperamentos
Explique como os dois principais temperamentos interagem entre si.

## Estratégias de Desenvolvimento Pessoal
Forneça orientações práticas para crescimento: hábitos emocionais, habilidades a desenvolver, atitudes a equilibrar.

## Plano de Evolução Pessoal
Sugira pelo menos 5 práticas com título e descrição detalhada.

## Conclusão
Finalize com resumo inspirador sobre potencial natural, como usar talentos e importância do autoconhecimento.

REGRAS:
- O relatório deve ser PROFUNDO, PROFISSIONAL, MOTIVADOR, CLARO e ESTRUTURADO
- Mínimo 2000 palavras
- Use linguagem profissional de análise comportamental
- Personalize para o nome do respondente
- Escreva em português brasileiro
- Use markdown para formatação
- Inclua a nota: "Os temperamentos indicam tendências naturais de comportamento e podem ser desenvolvidos ao longo da vida."
- NÃO mencione inteligência artificial ou IA
- NÃO use linguagem genérica — seja específico para a combinação de temperamentos`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scores, percentages, primary, secondary, primaryLabel, secondaryLabel, respondentName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = \`Gere um relatório de perfil temperamental completo para a seguinte pessoa:

Nome: \${respondentName || "Participante"}

Pontuações dos Temperamentos:
- Sanguíneo: \${scores.sanguineo} respostas (\${percentages.sanguineo}%)
- Fleumático: \${scores.fleumatico} respostas (\${percentages.fleumatico}%)
- Melancólico: \${scores.melancolico} respostas (\${percentages.melancolico}%)
- Colérico: \${scores.colerico} respostas (\${percentages.colerico}%)

Temperamento Predominante: \${primaryLabel} (\${primary})
Temperamento Secundário: \${secondaryLabel} (\${secondary})

Gere o relatório completo seguindo a estrutura definida. Seja profundo, profissional e personalizado para esta combinação específica de temperamentos \${primaryLabel} e \${secondaryLabel}.\`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
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
    console.error("generate-temperamento-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
