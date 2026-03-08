import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um Especialista em Psicologia Analítica, Tipologia de Personalidade e Avaliação Comportamental baseado no modelo MBTI (Myers-Briggs Type Indicator).

Sua função é gerar relatórios de personalidade MBTI completos, profissionais, profundos e motivadores.

O relatório DEVE seguir EXATAMENTE esta estrutura:

# Relatório de Personalidade MBTI
## [TIPO] — [Nome do Tipo]

# 1. Visão Geral
Descrição inspiradora e profunda da personalidade (3-4 parágrafos). Explique a essência desse tipo, como ele se manifesta no dia a dia e o que torna esse indivíduo único.

# 2. Como Essa Personalidade Age no Mundo
Comportamentos naturais, forma de interagir com o ambiente, primeiras impressões que causa nos outros (2-3 parágrafos).

# 3. Pontos Fortes Naturais
Liste e explique detalhadamente pelo menos 8 talentos e capacidades naturais. Cada ponto com título e explicação detalhada.

# 4. Desafios e Pontos de Crescimento
Explique pelo menos 6 dificuldades e áreas de desenvolvimento com título e detalhamento.

# 5. Como Age Sob Estresse
Situações que geram tensão, reações típicas, como o tipo se transforma sob pressão (2-3 parágrafos).

# 6. Comunicação
Como essa pessoa se expressa, estilo de comunicação verbal e não-verbal, como prefere receber informações (2-3 parágrafos).

# 7. Relacionamentos
Como se conecta com outras pessoas em contextos pessoais e profissionais (3-4 parágrafos).

# 8. Estilo de Aprendizado
Como aprende melhor, métodos preferidos, ambiente ideal de aprendizagem (2 parágrafos).

# 9. Procrastinação e Produtividade
Como lida com tarefas e prazos, padrões de produtividade, estratégias naturais (2 parágrafos).

# 10. Carreira Ideal
Tipos de ambientes profissionais ideais, valores no trabalho (2 parágrafos).

# 11. 20 Profissões Compatíveis
Liste exatamente 20 profissões alinhadas com explicação breve de cada uma.

# 12. Como Trabalha em Equipe
Papel natural em equipes, dinâmica com diferentes tipos (2 parágrafos).

# 13. Liderança
Estilo de liderança natural, pontos fortes e desafios como líder (2 parágrafos).

# 14. Tomada de Decisão
Processo natural de tomada de decisão, fatores que considera (2 parágrafos).

# 15. Caminho de Desenvolvimento Pessoal
Plano prático com pelo menos 7 recomendações numeradas para crescimento pessoal, cada uma com título e descrição detalhada.

Finalize com uma mensagem motivadora inspiradora sobre autoconhecimento e potencial de crescimento.

REGRAS:
- O relatório deve ser PROFUNDO, INSPIRADOR, PSICOLÓGICO, MOTIVADOR e FÁCIL DE ENTENDER
- Mínimo 3000 palavras
- Use linguagem envolvente semelhante a perfis de personalidade profissionais
- Personalize para o nome do respondente quando fornecido
- Escreva em português brasileiro
- Use markdown para formatação
- NÃO mencione inteligência artificial ou geração automatizada
- Seja específico para o tipo MBTI fornecido`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scores, type, typeName, dimensions, percentages, respondentName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Gere um relatório de personalidade MBTI completo para a seguinte pessoa:

Nome: ${respondentName || "Participante"}

Tipo de Personalidade: ${type} — ${typeName}

Pontuações por dimensão:
- Extroversão (E): ${scores.E} | Introversão (I): ${scores.I}
- Sensação (S): ${scores.S} | Intuição (N): ${scores.N}
- Pensamento (T): ${scores.T} | Sentimento (F): ${scores.F}
- Julgamento (J): ${scores.J} | Percepção (P): ${scores.P}

Percentuais:
- E: ${percentages.E}% vs I: ${percentages.I}%
- S: ${percentages.S}% vs N: ${percentages.N}%
- T: ${percentages.T}% vs F: ${percentages.F}%
- J: ${percentages.J}% vs P: ${percentages.P}%

Gere o relatório completo seguindo a estrutura definida. Seja profundo, inspirador e personalizado para o tipo ${type} — ${typeName}.`;

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
    console.error("generate-mbti-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
