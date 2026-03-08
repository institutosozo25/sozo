/**
 * DISC Questionnaire Data
 * Based on the professional DISC 5.0 assessment.
 * Each group has 4 options mapped to D, I, S, C profiles.
 * User selects which option MOST and LEAST represents them.
 * MOST = +1, LEAST = -1 for that profile.
 */

export interface DiscOption {
  id: string;
  text: string;
  profile: "D" | "I" | "S" | "C";
}

export interface DiscQuestionGroup {
  id: string;
  title: string;
  options: DiscOption[];
}

export const DISC_QUESTION_GROUPS: DiscQuestionGroup[] = [
  // Block 1
  {
    id: "q1",
    title: "Tende a agir de forma...",
    options: [
      { id: "q1a", text: "Assertiva", profile: "D" },
      { id: "q1b", text: "Persuasiva", profile: "I" },
      { id: "q1c", text: "Paciente", profile: "S" },
      { id: "q1d", text: "Contemplativa", profile: "C" },
    ],
  },
  {
    id: "q2",
    title: "Confortável com...",
    options: [
      { id: "q2a", text: "Ser decisivo", profile: "D" },
      { id: "q2b", text: "Amizade social", profile: "I" },
      { id: "q2c", text: "Ser parte de um time", profile: "S" },
      { id: "q2d", text: "Planejamento e ordem", profile: "C" },
    ],
  },
  {
    id: "q3",
    title: "Desejo de...",
    options: [
      { id: "q3a", text: "Variedade", profile: "D" },
      { id: "q3b", text: "Menos estrutura", profile: "I" },
      { id: "q3c", text: "Harmonia", profile: "S" },
      { id: "q3d", text: "Lógica", profile: "C" },
    ],
  },
  {
    id: "q4",
    title: "Sob estresse pode se tornar...",
    options: [
      { id: "q4a", text: "Ditatorial", profile: "D" },
      { id: "q4b", text: "Sarcástico", profile: "I" },
      { id: "q4c", text: "Submisso", profile: "S" },
      { id: "q4d", text: "Arredio", profile: "C" },
    ],
  },
  {
    id: "q5",
    title: "Característica principal...",
    options: [
      { id: "q5a", text: "Franco", profile: "D" },
      { id: "q5b", text: "Otimista", profile: "I" },
      { id: "q5c", text: "Serviçal", profile: "S" },
      { id: "q5d", text: "Ordeiro", profile: "C" },
    ],
  },
  // Block 2
  {
    id: "q6",
    title: "Quando em conflito, esse estilo...",
    options: [
      { id: "q6a", text: "Demanda ação", profile: "D" },
      { id: "q6b", text: "Ataca", profile: "I" },
      { id: "q6c", text: "Reclama", profile: "S" },
      { id: "q6d", text: "Evita", profile: "C" },
    ],
  },
  {
    id: "q7",
    title: "Força aparente...",
    options: [
      { id: "q7a", text: "Solucionador de problemas", profile: "D" },
      { id: "q7b", text: "Encorajador", profile: "I" },
      { id: "q7c", text: "Apoiador", profile: "S" },
      { id: "q7d", text: "Organizador", profile: "C" },
    ],
  },
  {
    id: "q8",
    title: "Com erros...",
    options: [
      { id: "q8a", text: "Informa o erro diretamente", profile: "D" },
      { id: "q8b", text: "Chama a pessoa e explica o erro", profile: "I" },
      { id: "q8c", text: "Fica calado e aceita o erro", profile: "S" },
      { id: "q8d", text: "Se incomoda e questiona", profile: "C" },
    ],
  },
  {
    id: "q9",
    title: "Sob estresse pode se tornar...",
    options: [
      { id: "q9a", text: "Crítico", profile: "D" },
      { id: "q9b", text: "Superficial", profile: "I" },
      { id: "q9c", text: "Indeciso", profile: "S" },
      { id: "q9d", text: "Cabeça dura", profile: "C" },
    ],
  },
  {
    id: "q10",
    title: "Pode ser considerado...",
    options: [
      { id: "q10a", text: "Impaciente", profile: "D" },
      { id: "q10b", text: "Inoportuno", profile: "I" },
      { id: "q10c", text: "Indeciso", profile: "S" },
      { id: "q10d", text: "Inseguro", profile: "C" },
    ],
  },
  // Block 3
  {
    id: "q11",
    title: "Necessita de...",
    options: [
      { id: "q11a", text: "Controle", profile: "D" },
      { id: "q11b", text: "Aprovação", profile: "I" },
      { id: "q11c", text: "Rotina", profile: "S" },
      { id: "q11d", text: "Padrão", profile: "C" },
    ],
  },
  {
    id: "q12",
    title: "Limitação desse perfil...",
    options: [
      { id: "q12a", text: "Direto", profile: "D" },
      { id: "q12b", text: "Desorganizado", profile: "I" },
      { id: "q12c", text: "Indireto", profile: "S" },
      { id: "q12d", text: "Detalhista", profile: "C" },
    ],
  },
  {
    id: "q13",
    title: "Possui medo de...",
    options: [
      { id: "q13a", text: "Perder", profile: "D" },
      { id: "q13b", text: "Rejeição", profile: "I" },
      { id: "q13c", text: "Mudanças bruscas", profile: "S" },
      { id: "q13d", text: "Estar errado", profile: "C" },
    ],
  },
  {
    id: "q14",
    title: "Mensura desempenho com...",
    options: [
      { id: "q14a", text: "Resultados", profile: "D" },
      { id: "q14b", text: "Reconhecimento", profile: "I" },
      { id: "q14c", text: "Compatibilidade", profile: "S" },
      { id: "q14d", text: "Precisão", profile: "C" },
    ],
  },
  {
    id: "q15",
    title: "Com subalternos, costuma ser...",
    options: [
      { id: "q15a", text: "Orgulhoso", profile: "D" },
      { id: "q15b", text: "Permissivo", profile: "I" },
      { id: "q15c", text: "Humilde", profile: "S" },
      { id: "q15d", text: "Cauteloso", profile: "C" },
    ],
  },
  // Block 4
  {
    id: "q16",
    title: "Abordagem primária...",
    options: [
      { id: "q16a", text: "Independente", profile: "D" },
      { id: "q16b", text: "Interativo", profile: "I" },
      { id: "q16c", text: "Estável", profile: "S" },
      { id: "q16d", text: "Corretivo", profile: "C" },
    ],
  },
  {
    id: "q17",
    title: "Outra limitação desse perfil...",
    options: [
      { id: "q17a", text: "Intenso", profile: "D" },
      { id: "q17b", text: "Não tradicional", profile: "I" },
      { id: "q17c", text: "Indeciso", profile: "S" },
      { id: "q17d", text: "Impessoal", profile: "C" },
    ],
  },
  {
    id: "q18",
    title: "Ponto cego...",
    options: [
      { id: "q18a", text: "Ser responsabilizado", profile: "D" },
      { id: "q18b", text: "Realizar compromissos", profile: "I" },
      { id: "q18c", text: "Necessidade de mudança", profile: "S" },
      { id: "q18d", text: "Tomada de decisão", profile: "C" },
    ],
  },
  {
    id: "q19",
    title: "Mensura desempenho com...",
    options: [
      { id: "q19a", text: "Histórico", profile: "D" },
      { id: "q19b", text: "Elogios", profile: "I" },
      { id: "q19c", text: "Contribuição", profile: "S" },
      { id: "q19d", text: "Qualidade dos resultados", profile: "C" },
    ],
  },
  {
    id: "q20",
    title: "Prefere tarefas...",
    options: [
      { id: "q20a", text: "Desafiadoras", profile: "D" },
      { id: "q20b", text: "Relacionada a pessoas", profile: "I" },
      { id: "q20c", text: "Agendadas", profile: "S" },
      { id: "q20d", text: "Estruturadas", profile: "C" },
    ],
  },
  // Block 5
  {
    id: "q21",
    title: "Com atrasos...",
    options: [
      { id: "q21a", text: "Se irrita e confronta", profile: "D" },
      { id: "q21b", text: "Nem liga, está distraído", profile: "I" },
      { id: "q21c", text: "Sabe do atraso, mas aceita", profile: "S" },
      { id: "q21d", text: "Reclama e analisa a situação", profile: "C" },
    ],
  },
  {
    id: "q22",
    title: "Em situações extremas...",
    options: [
      { id: "q22a", text: "Se preocupa demais com metas", profile: "D" },
      { id: "q22b", text: "Fala sem pensar", profile: "I" },
      { id: "q22c", text: "Procrastina ao invés de fazer", profile: "S" },
      { id: "q22d", text: "Analisa demais", profile: "C" },
    ],
  },
  {
    id: "q23",
    title: "Precisa melhorar...",
    options: [
      { id: "q23a", text: "Empatia e Paciência", profile: "D" },
      { id: "q23b", text: "Controle emocional", profile: "I" },
      { id: "q23c", text: "Ser assertivo sob pressão", profile: "S" },
      { id: "q23d", text: "Se preocupar menos sobre tudo", profile: "C" },
    ],
  },
  {
    id: "q24",
    title: "Em uma discussão...",
    options: [
      { id: "q24a", text: "Busca ter a razão", profile: "D" },
      { id: "q24b", text: "Busca diminuir o conflito", profile: "I" },
      { id: "q24c", text: "Busca concordância", profile: "S" },
      { id: "q24d", text: "Busca comprovar sua opinião", profile: "C" },
    ],
  },
  {
    id: "q25",
    title: "Quando vai às compras...",
    options: [
      { id: "q25a", text: "Sabe o que quer", profile: "D" },
      { id: "q25b", text: "Se diverte", profile: "I" },
      { id: "q25c", text: "Fica indeciso", profile: "S" },
      { id: "q25d", text: "Busca ofertas", profile: "C" },
    ],
  },
];

export const PROFILE_LABELS: Record<string, string> = {
  D: "Dominante",
  I: "Influente",
  S: "Estável",
  C: "Conforme",
};

export const PROFILE_COLORS: Record<string, string> = {
  D: "hsl(358, 84%, 56%)",
  I: "hsl(33, 96%, 49%)",
  S: "hsl(226, 88%, 57%)",
  C: "hsl(160, 60%, 40%)",
};
