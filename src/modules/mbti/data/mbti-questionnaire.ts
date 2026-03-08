/**
 * MBTI 70-Question Personality Test
 * Each question has options A and B mapping to one of 4 dimensions:
 * E/I (Extroversion/Introversion)
 * S/N (Sensing/Intuition)
 * T/F (Thinking/Feeling)
 * J/P (Judging/Perceiving)
 */

export type MbtiDimension = "EI" | "SN" | "TF" | "JP";
export type MbtiPole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export interface MbtiQuestion {
  id: number;
  text: string;
  optionA: string;
  optionB: string;
  dimension: MbtiDimension;
  aMapping: MbtiPole; // What pole option A maps to
  bMapping: MbtiPole; // What pole option B maps to
}

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  // Group 1 (Q1-7)
  { id: 1, text: "Numa festa você:", optionA: "Interage com muitos, incluindo estranhos", optionB: "Interage com poucos, apenas conhecidos", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 2, text: "Você é mais:", optionA: "Realista", optionB: "Filosófico", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 3, text: "Você se interessa mais por:", optionA: "Fatos", optionB: "Semelhanças e comparações", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 4, text: "Normalmente você é:", optionA: "Justo", optionB: "Sensível", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 5, text: "Você tende ser mais:", optionA: "Calculista", optionB: "Empático", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 6, text: "Você prefere trabalhar:", optionA: "Na última hora", optionB: "Ao longo do tempo", dimension: "JP", aMapping: "P", bMapping: "J" },
  { id: 7, text: "Você tende escolher:", optionA: "Cuidadosamente", optionB: "Impulsivamente", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 2 (Q8-14)
  { id: 8, text: "Nas festas você:", optionA: "Fica até tarde, com muita disposição", optionB: "Sai cedo, com pouca disposição", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 9, text: "Você é uma pessoa mais:", optionA: "Sensível", optionB: "Reflexiva", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 10, text: "Você é mais inclinado a ser:", optionA: "Objetivo", optionB: "Abstrato", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 11, text: "Para você é mais natural ser:", optionA: "Justa com os outros", optionB: "Agradável", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 12, text: "Num primeiro contato com os outros, você é:", optionA: "Impessoal e desinteressado", optionB: "Pessoal e interessado", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 13, text: "Normalmente você é:", optionA: "Pontual", optionB: "Sossegado", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 14, text: "Você se incomoda mais em ter coisas:", optionA: "Incompletas", optionB: "Completas", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 3 (Q15-21)
  { id: 15, text: "Em seus grupos sociais você:", optionA: "Mantém-se atualizado acerca dos acontecimentos", optionB: "Fica desatualizado", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 16, text: "Normalmente você se interessa mais por:", optionA: "Detalhes", optionB: "Conceitos", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 17, text: "Você prefere escritores que:", optionA: "Vão direto ao assunto", optionB: "Usam muitas analogias", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 18, text: "Naturalmente você é mais:", optionA: "Imparcial", optionB: "Compassivo", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 19, text: "Num julgamento é mais comum você ser:", optionA: "Impessoal", optionB: "Sentimental", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 20, text: "Você normalmente:", optionA: "Define as coisas", optionB: "Mantém-se aberto às opções", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 21, text: "Você normalmente prefere:", optionA: "Rapidamente concordar com um horário", optionB: "Relutar em aceitar um horário", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 4 (Q22-28)
  { id: 22, text: "Ao ligar para alguém você:", optionA: "Apenas começa falando", optionB: "Prepara o que irá dizer", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 23, text: "Fatos:", optionA: "Falam por eles mesmos", optionB: "Normalmente requerem que sejam interpretados", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 24, text: "Você prefere trabalhar com:", optionA: "Informações práticas", optionB: "Ideias abstratas", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 25, text: "Você é mais inclinado a ser uma pessoa:", optionA: "Fria", optionB: "Calorosa", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 26, text: "Você preferiria ser:", optionA: "Mais justo que misericordioso", optionB: "Mais misericordioso que justo", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 27, text: "Você se sente mais confortável:", optionA: "Cumprindo um cronograma", optionB: "Colocando-as de lado", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 28, text: "Você se sente mais confortável com:", optionA: "Acordos escritos", optionB: "Acordos de palavra", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 5 (Q29-35)
  { id: 29, text: "Quando na companhia de alguém você:", optionA: "Inicia as conversas", optionB: "Espera ser abordado", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 30, text: "O senso comum tradicional é:", optionA: "Normalmente confiável", optionB: "Frequentemente enganoso", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 31, text: "As crianças normalmente:", optionA: "Fazem-se suficientemente úteis", optionB: "Sonham o bastante", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 32, text: "Você normalmente é mais:", optionA: "De caráter forte", optionB: "Gentil e simpático", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 33, text: "Você é mais:", optionA: "Firme do que gentil", optionB: "Gentil do que firme", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 34, text: "Você é mais tendencioso a manter as coisas:", optionA: "Bem organizadas", optionB: "Sem terminar", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 35, text: "Você dá mais valor ao que é:", optionA: "Definitivo", optionB: "Mutável", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 6 (Q36-42)
  { id: 36, text: "Novas interações com outros:", optionA: "O estimulam e incentivam", optionB: "Consomem suas energias", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 37, text: "Frequentemente você é:", optionA: "Uma pessoa do tipo prática", optionB: "Um tipo de pessoa abstrata", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 38, text: "Qual dos itens se identifica mais com você:", optionA: "Percepção exata e sem enganos", optionB: "Formação de conceitos", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 39, text: "O que é mais realizador:", optionA: "Discutir uma questão profundamente", optionB: "Chegar a um acordo acerca de um assunto", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 40, text: "O que te conduz mais:", optionA: "Sua cabeça", optionB: "Seu coração", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 41, text: "Você se sente mais confortável com um trabalho:", optionA: "Contratado", optionB: "Feito de forma casual", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 42, text: "Você prefere que as coisas sejam:", optionA: "Certas e ordenadas", optionB: "Opcionais", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 7 (Q43-49)
  { id: 43, text: "Você prefere:", optionA: "Muitos amigos com breves contatos", optionB: "Poucos amigos com um contato mais longo", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 44, text: "Você é mais atraído a:", optionA: "Informações substanciais", optionB: "Suposições confiáveis", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 45, text: "Você se interessa mais em:", optionA: "Produção", optionB: "Pesquisas", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 46, text: "Você se sente mais confortável quando está sendo:", optionA: "Objetivo", optionB: "Pessoal", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 47, text: "Você se avalia como uma pessoa que é mais:", optionA: "Indisposta", optionB: "Dedicada e esforçada", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 48, text: "Você fica mais confortável com uma:", optionA: "Opinião final", optionB: "Opinião incerta", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 49, text: "Você fica mais confortável:", optionA: "Após uma decisão", optionB: "Antes de uma decisão", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 8 (Q50-56)
  { id: 50, text: "Você:", optionA: "Fala fácil e longamente com desconhecidos", optionB: "Não tem muito que dizer a desconhecidos", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 51, text: "Você normalmente é mais interessado em:", optionA: "Um fato isolado", optionB: "Um caso geral", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 52, text: "Você se sente:", optionA: "Mais prático do que engenhoso", optionB: "Mais engenhoso do que prático", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 53, text: "Você tipicamente é uma pessoa com:", optionA: "Claros propósitos", optionB: "Sentimentos fortes", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 54, text: "Você se inclina mais a ser:", optionA: "Justo", optionB: "Compreensivo", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 55, text: "É mais preferível:", optionA: "Certificar-se de que as coisas estão certas", optionB: "Apenas deixar que as coisas aconteçam", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 56, text: "É mais do seu jeito:", optionA: "Deixar as coisas ajeitadas", optionB: "Acomodar-se", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 9 (Q57-63)
  { id: 57, text: "Quando o telefone toca você:", optionA: "Corre para atender", optionB: "Espera que alguém atenda", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 58, text: "Você acha que tem mais:", optionA: "Um bom senso de realidade", optionB: "Uma boa imaginação", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 59, text: "Você é mais atraído a:", optionA: "Fundamentos", optionB: "Insinuações", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 60, text: "Ao julgar você é mais:", optionA: "Neutro", optionB: "Cuidadoso", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 61, text: "Você considera a si mesmo uma pessoa:", optionA: "Capaz de pensar claramente", optionB: "De boa intenção", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 62, text: "Você é mais tendencioso a:", optionA: "Organizar as atividades", optionB: "Pegar as coisas quando elas vêm", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 63, text: "Você é uma pessoa que é mais:", optionA: "Sistemática", optionB: "Imprevisível", dimension: "JP", aMapping: "J", bMapping: "P" },

  // Group 10 (Q64-70)
  { id: 64, text: "Você é mais inclinado a ser:", optionA: "De fácil acesso", optionB: "De certa forma reservado", dimension: "EI", aMapping: "E", bMapping: "I" },
  { id: 65, text: "Você se diverte mais com:", optionA: "Experiências palpáveis", optionB: "Imaginações", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 66, text: "Você prefere:", optionA: "Algo mais literal", optionB: "Algo mais figurativo", dimension: "SN", aMapping: "S", bMapping: "N" },
  { id: 67, text: "Normalmente você é mais:", optionA: "Imparcial", optionB: "Compassivo", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 68, text: "Tipicamente você é mais:", optionA: "Justo do que bondoso", optionB: "Bondoso do que justo", dimension: "TF", aMapping: "T", bMapping: "F" },
  { id: 69, text: "É mais parecido com você:", optionA: "Fazer rápidos juízos", optionB: "Demorar-se em fazer julgamentos", dimension: "JP", aMapping: "J", bMapping: "P" },
  { id: 70, text: "Você tende a ser mais:", optionA: "Deliberado do que espontâneo", optionB: "Espontâneo do que deliberado", dimension: "JP", aMapping: "J", bMapping: "P" },
];

export const MBTI_TYPE_NAMES: Record<string, string> = {
  ISTJ: "O Maestro",
  ISFJ: "O Defensor",
  INFJ: "O Conselheiro",
  INTJ: "O Arquiteto",
  ISTP: "O Cirúrgico",
  ISFP: "O Aventureiro",
  INFP: "O Mediador",
  INTP: "O Lógico",
  ESTP: "O Empreendedor",
  ESFP: "O Motivador",
  ENFP: "O Inspirador",
  ENTP: "O Inovador",
  ESTJ: "O Executivo",
  ESFJ: "O Cônsul",
  ENFJ: "O Protagonista",
  ENTJ: "O Imperador",
};

export const MBTI_TYPE_DESCRIPTIONS: Record<string, string> = {
  ISTJ: "Práticos, organizados e responsáveis. Valorizam tradições e são extremamente confiáveis e dedicados em tudo que fazem.",
  ISFJ: "Protetores dedicados e calorosos. Comprometidos em servir e proteger as pessoas ao seu redor com lealdade inabalável.",
  INFJ: "Idealistas visionários com profunda empatia. Buscam significado e propósito, inspirando os outros com sua sabedoria.",
  INTJ: "Estrategistas brilhantes e independentes. Pensadores de longo prazo que transformam visão em realidade com precisão.",
  ISTP: "Práticos, ousados e excelentes no uso de ferramentas. Procuram sempre consertar problemas através da criação.",
  ISFP: "Artistas sensíveis e aventureiros. Vivem no presente com intensidade e expressam-se através da beleza e ação.",
  INFP: "Idealistas compassivos e criativos. Guiados por valores profundos, buscam tornar o mundo um lugar melhor.",
  INTP: "Pensadores lógicos e inovadores. Fascinados por sistemas e teorias, buscam compreender o universo ao seu redor.",
  ESTP: "Empreendedores dinâmicos e pragmáticos. Vivem no momento e agem rapidamente para resolver problemas reais.",
  ESFP: "Motivadores entusiastas e espontâneos. Trazem alegria e energia para qualquer ambiente com seu carisma natural.",
  ENFP: "Inspiradores criativos e cheios de energia. Veem possibilidades infinitas e motivam os outros a realizarem seu potencial.",
  ENTP: "Inovadores audaciosos e intelectualmente curiosos. Amam debater ideias e desafiar o status quo com criatividade.",
  ESTJ: "Executivos organizados e decisivos. Líderes naturais que estabelecem ordem e garantem que os objetivos sejam alcançados.",
  ESFJ: "Cônsules calorosos e sociáveis. Dedicados ao bem-estar dos outros, criam harmonia e conexão em seus grupos.",
  ENFJ: "Protagonistas carismáticos e inspiradores. Líderes naturais que motivam os outros a crescer e alcançar seu melhor.",
  ENTJ: "Imperadores estratégicos e determinados. A energia vibrante que molda o mundo ao seu redor com liderança visionária.",
};

export const DIMENSION_LABELS: Record<string, string> = {
  E: "Extroversão",
  I: "Introversão",
  S: "Sensação",
  N: "Intuição",
  T: "Pensamento",
  F: "Sentimento",
  J: "Julgamento",
  P: "Percepção",
};

export const DIMENSION_COLORS: Record<string, string> = {
  E: "hsl(220, 70%, 55%)",
  I: "hsl(260, 60%, 55%)",
  S: "hsl(30, 80%, 55%)",
  N: "hsl(170, 60%, 45%)",
  T: "hsl(0, 65%, 55%)",
  F: "hsl(340, 60%, 55%)",
  J: "hsl(140, 55%, 45%)",
  P: "hsl(45, 80%, 50%)",
};

export const TOTAL_QUESTIONS = MBTI_QUESTIONS.length;
