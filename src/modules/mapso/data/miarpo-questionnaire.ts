export interface QuestionItem {
  id: string;
  text: string;
  dimensionId: string;
}

export interface Dimension {
  id: string;
  name: string;
  shortName: string;
  description: string;
  weight: number;
  isInverted: boolean;
  items: QuestionItem[];
}

export const LIKERT_LABELS = [
  { value: 1, label: "Nunca" },
  { value: 2, label: "Raramente" },
  { value: 3, label: "Às vezes" },
  { value: 4, label: "Frequentemente" },
  { value: 5, label: "Sempre" },
];

export const DIMENSIONS: Dimension[] = [
  {
    id: "DP",
    name: "Demanda Psicológica do Trabalho",
    shortName: "Demanda Psicológica",
    description: "Grau de exigência cognitiva, emocional e operacional imposto ao trabalhador.",
    weight: 0.15,
    isInverted: false,
    items: [
      { id: "DP1", text: "Meu trabalho exige que eu trabalhe muito rápido.", dimensionId: "DP" },
      { id: "DP2", text: "Tenho excesso de tarefas para o tempo disponível.", dimensionId: "DP" },
      { id: "DP3", text: "Trabalho sob pressão constante por resultados.", dimensionId: "DP" },
      { id: "DP4", text: "Os prazos estabelecidos são difíceis de cumprir.", dimensionId: "DP" },
      { id: "DP5", text: "Minhas atividades exigem esforço mental intenso.", dimensionId: "DP" },
      { id: "DP6", text: "Sou frequentemente interrompido durante minhas tarefas.", dimensionId: "DP" },
      { id: "DP7", text: "Meu trabalho exige esforço emocional elevado.", dimensionId: "DP" },
      { id: "DP8", text: "Sinto-me sobrecarregado com minhas responsabilidades.", dimensionId: "DP" },
    ],
  },
  {
    id: "CA",
    name: "Controle e Autonomia",
    shortName: "Controle/Autonomia",
    description: "Grau de controle do trabalhador sobre decisões e organização de suas tarefas.",
    weight: 0.10,
    isInverted: true,
    items: [
      { id: "CA1", text: "Tenho liberdade para decidir como realizar meu trabalho.", dimensionId: "CA" },
      { id: "CA2", text: "Posso influenciar decisões relacionadas às minhas tarefas.", dimensionId: "CA" },
      { id: "CA3", text: "Tenho controle sobre o ritmo do meu trabalho.", dimensionId: "CA" },
      { id: "CA4", text: "Minha função possui responsabilidades claramente definidas.", dimensionId: "CA" },
      { id: "CA5", text: "Posso sugerir melhorias nos processos.", dimensionId: "CA" },
      { id: "CA6", text: "Tenho autonomia para resolver problemas do trabalho.", dimensionId: "CA" },
      { id: "CA7", text: "Minha opinião é considerada nas decisões.", dimensionId: "CA" },
      { id: "CA8", text: "Posso organizar minhas atividades com flexibilidade.", dimensionId: "CA" },
    ],
  },
  {
    id: "AS",
    name: "Apoio Social Organizacional",
    shortName: "Apoio Social",
    description: "Nível de suporte emocional, instrumental e técnico recebido da liderança e colegas.",
    weight: 0.10,
    isInverted: true,
    items: [
      { id: "AS1", text: "Recebo apoio da liderança quando necessário.", dimensionId: "AS" },
      { id: "AS2", text: "Meus colegas colaboram quando preciso de ajuda.", dimensionId: "AS" },
      { id: "AS3", text: "A comunicação na equipe é clara e eficiente.", dimensionId: "AS" },
      { id: "AS4", text: "Sinto-me integrado à minha equipe de trabalho.", dimensionId: "AS" },
      { id: "AS5", text: "A liderança está disponível quando preciso.", dimensionId: "AS" },
      { id: "AS6", text: "Existe espírito de cooperação no meu setor.", dimensionId: "AS" },
      { id: "AS7", text: "Recebo orientação adequada para realizar meu trabalho.", dimensionId: "AS" },
      { id: "AS8", text: "Posso contar com suporte emocional dos colegas.", dimensionId: "AS" },
    ],
  },
  {
    id: "RR",
    name: "Reconhecimento e Recompensa",
    shortName: "Reconhecimento",
    description: "Percepção de justiça, valorização e retorno pelo esforço realizado.",
    weight: 0.10,
    isInverted: true,
    items: [
      { id: "RR1", text: "Meu trabalho é valorizado pela organização.", dimensionId: "RR" },
      { id: "RR2", text: "Recebo reconhecimento pelo meu desempenho.", dimensionId: "RR" },
      { id: "RR3", text: "Considero justa minha remuneração.", dimensionId: "RR" },
      { id: "RR4", text: "Existem oportunidades de crescimento profissional.", dimensionId: "RR" },
      { id: "RR5", text: "O esforço no trabalho é recompensado adequadamente.", dimensionId: "RR" },
      { id: "RR6", text: "Sinto que a organização valoriza minhas contribuições.", dimensionId: "RR" },
      { id: "RR7", text: "Os critérios de promoção são claros e justos.", dimensionId: "RR" },
      { id: "RR8", text: "Recebo feedback positivo pelo meu trabalho.", dimensionId: "RR" },
    ],
  },
  {
    id: "RI",
    name: "Relações Interpessoais e Respeito",
    shortName: "Relações Interpessoais",
    description: "Qualidade das interações sociais no ambiente de trabalho.",
    weight: 0.10,
    isInverted: true,
    items: [
      { id: "RI1", text: "Existe respeito entre os colaboradores.", dimensionId: "RI" },
      { id: "RI2", text: "O ambiente de trabalho é harmonioso.", dimensionId: "RI" },
      { id: "RI3", text: "Conflitos são resolvidos de forma adequada.", dimensionId: "RI" },
      { id: "RI4", text: "Sou tratado com respeito no trabalho.", dimensionId: "RI" },
      { id: "RI5", text: "Não presencio comportamentos hostis entre colegas.", dimensionId: "RI" },
      { id: "RI6", text: "Existe cooperação entre setores.", dimensionId: "RI" },
      { id: "RI7", text: "Sinto-me seguro nas interações profissionais.", dimensionId: "RI" },
      { id: "RI8", text: "Não sofro tratamento injusto no trabalho.", dimensionId: "RI" },
    ],
  },
  {
    id: "SP",
    name: "Segurança Psicológica",
    shortName: "Seg. Psicológica",
    description: "Percepção de que o trabalhador pode expressar opiniões sem punição.",
    weight: 0.10,
    isInverted: true,
    items: [
      { id: "SP1", text: "Posso expressar opiniões sem medo.", dimensionId: "SP" },
      { id: "SP2", text: "Posso admitir erros sem punição excessiva.", dimensionId: "SP" },
      { id: "SP3", text: "A liderança incentiva participação.", dimensionId: "SP" },
      { id: "SP4", text: "Sinto-me confortável ao dar sugestões.", dimensionId: "SP" },
      { id: "SP5", text: "Posso questionar decisões quando necessário.", dimensionId: "SP" },
      { id: "SP6", text: "Existe abertura para diálogo na empresa.", dimensionId: "SP" },
      { id: "SP7", text: "Posso falar sobre dificuldades no trabalho.", dimensionId: "SP" },
      { id: "SP8", text: "A organização incentiva aprendizado com erros.", dimensionId: "SP" },
    ],
  },
  {
    id: "SE",
    name: "Saúde Emocional Percebida",
    shortName: "Saúde Emocional",
    description: "Percepção subjetiva do estado emocional relacionado ao trabalho.",
    weight: 0.20,
    isInverted: false,
    items: [
      { id: "SE1", text: "Sinto-me emocionalmente esgotado pelo trabalho.", dimensionId: "SE" },
      { id: "SE2", text: "Sinto estresse relacionado ao trabalho com frequência.", dimensionId: "SE" },
      { id: "SE3", text: "Sinto ansiedade ao pensar no trabalho.", dimensionId: "SE" },
      { id: "SE4", text: "Tenho dificuldade de me recuperar após o expediente.", dimensionId: "SE" },
      { id: "SE5", text: "Sinto-me mentalmente cansado durante o trabalho.", dimensionId: "SE" },
      { id: "SE6", text: "Meu trabalho afeta negativamente meu bem-estar.", dimensionId: "SE" },
      { id: "SE7", text: "Tenho dificuldade de manter energia para trabalhar.", dimensionId: "SE" },
      { id: "SE8", text: "Sinto desgaste psicológico relacionado ao trabalho.", dimensionId: "SE" },
    ],
  },
  {
    id: "EN",
    name: "Engajamento e Sentido do Trabalho",
    shortName: "Engajamento",
    description: "Nível de envolvimento psicológico e significado atribuído ao trabalho.",
    weight: 0.15,
    isInverted: true,
    items: [
      { id: "EN1", text: "Sinto-me motivado com meu trabalho.", dimensionId: "EN" },
      { id: "EN2", text: "Meu trabalho tem significado para mim.", dimensionId: "EN" },
      { id: "EN3", text: "Sinto orgulho de trabalhar nesta organização.", dimensionId: "EN" },
      { id: "EN4", text: "Estou comprometido com os objetivos da empresa.", dimensionId: "EN" },
      { id: "EN5", text: "Sinto entusiasmo ao realizar minhas atividades.", dimensionId: "EN" },
      { id: "EN6", text: "Meu trabalho contribui para meu crescimento pessoal.", dimensionId: "EN" },
      { id: "EN7", text: "Sinto-me envolvido com minhas tarefas.", dimensionId: "EN" },
      { id: "EN8", text: "Tenho vontade de permanecer nesta organização.", dimensionId: "EN" },
    ],
  },
];

export const getAllItems = (): QuestionItem[] => {
  return DIMENSIONS.flatMap((d) => d.items);
};

export type RiskLevel = "very-low" | "low" | "moderate" | "high" | "critical";

export interface RiskClassification {
  level: RiskLevel;
  label: string;
  description: string;
  color: string;
  range: [number, number];
}

export const RISK_CLASSIFICATIONS: RiskClassification[] = [
  { level: "very-low", label: "Muito Baixo", description: "Ambiente psicologicamente saudável", color: "hsl(152, 60%, 42%)", range: [0, 20] },
  { level: "low", label: "Baixo", description: "Risco mínimo — manter monitoramento", color: "hsl(152, 45%, 55%)", range: [21, 40] },
  { level: "moderate", label: "Moderado", description: "Atenção preventiva necessária", color: "hsl(42, 85%, 55%)", range: [41, 60] },
  { level: "high", label: "Alto", description: "Intervenção organizacional recomendada", color: "hsl(20, 85%, 55%)", range: [61, 80] },
  { level: "critical", label: "Crítico", description: "Risco elevado de adoecimento — ação urgente", color: "hsl(0, 72%, 51%)", range: [81, 100] },
];

export const getRiskClassification = (score: number): RiskClassification => {
  if (score <= 20) return RISK_CLASSIFICATIONS[0];
  if (score <= 40) return RISK_CLASSIFICATIONS[1];
  if (score <= 60) return RISK_CLASSIFICATIONS[2];
  if (score <= 80) return RISK_CLASSIFICATIONS[3];
  return RISK_CLASSIFICATIONS[4];
};
