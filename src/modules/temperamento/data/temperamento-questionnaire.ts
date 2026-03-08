/**
 * Temperamento Questionnaire Data
 * 25 questions, each with 4 options mapped to temperaments:
 * I → Sanguíneo, C → Fleumático, O → Melancólico, A → Colérico
 */

export type TemperamentoType = "sanguineo" | "fleumatico" | "melancolico" | "colerico";

export interface TemperamentoOption {
  id: string;
  letter: "I" | "C" | "O" | "A";
  text: string;
  temperamento: TemperamentoType;
}

export interface TemperamentoQuestion {
  id: string;
  number: number;
  title: string;
  options: TemperamentoOption[];
}

const LETTER_TO_TEMPERAMENTO: Record<string, TemperamentoType> = {
  I: "sanguineo",
  C: "fleumatico",
  O: "melancolico",
  A: "colerico",
};

function makeOptions(qId: string, opts: { letter: "I" | "C" | "O" | "A"; text: string }[]): TemperamentoOption[] {
  return opts.map((o, i) => ({
    id: `${qId}_${o.letter}`,
    letter: o.letter,
    text: o.text,
    temperamento: LETTER_TO_TEMPERAMENTO[o.letter],
  }));
}

export const TEMPERAMENTO_QUESTIONS: TemperamentoQuestion[] = [
  {
    id: "q1", number: 1, title: "Eu sou...",
    options: makeOptions("q1", [
      { letter: "I", text: "Idealista, criativo e visionário" },
      { letter: "C", text: "Divertido, espiritual e benéfico" },
      { letter: "O", text: "Confiável, meticuloso e previsível" },
      { letter: "A", text: "Focado, determinado e persistente" },
    ]),
  },
  {
    id: "q2", number: 2, title: "Eu gosto de...",
    options: makeOptions("q2", [
      { letter: "A", text: "Ser piloto" },
      { letter: "C", text: "Conversar com os passageiros" },
      { letter: "O", text: "Planejar a viagem" },
      { letter: "I", text: "Explorar novas rotas" },
    ]),
  },
  {
    id: "q3", number: 3, title: "Se você quiser se dar bem comigo...",
    options: makeOptions("q3", [
      { letter: "I", text: "Me dê liberdade" },
      { letter: "O", text: "Me deixe saber sua expectativa" },
      { letter: "A", text: "Lidere, siga ou saia do caminho" },
      { letter: "C", text: "Seja amigável, carinhoso e compreensivo" },
    ]),
  },
  {
    id: "q4", number: 4, title: "Para conseguir bons resultados é preciso...",
    options: makeOptions("q4", [
      { letter: "I", text: "Ter incertezas" },
      { letter: "O", text: "Controlar o essencial" },
      { letter: "C", text: "Diversão e celebração" },
      { letter: "A", text: "Planejar e obter recursos" },
    ]),
  },
  {
    id: "q5", number: 5, title: "Eu me divirto quando...",
    options: makeOptions("q5", [
      { letter: "A", text: "Estou me exercitando" },
      { letter: "I", text: "Tenho novidades" },
      { letter: "C", text: "Estou com outros" },
      { letter: "O", text: "Determino as regras" },
    ]),
  },
  {
    id: "q6", number: 6, title: "Eu penso que...",
    options: makeOptions("q6", [
      { letter: "C", text: "Unidos venceremos, divididos perderemos" },
      { letter: "A", text: "O ataque é melhor que a defesa" },
      { letter: "I", text: "É bom ser manso, mas andar com um porrete" },
      { letter: "O", text: "Um homem prevenido vale por dois" },
    ]),
  },
  {
    id: "q7", number: 7, title: "Minha preocupação é...",
    options: makeOptions("q7", [
      { letter: "I", text: "Gerar a ideia global" },
      { letter: "C", text: "Fazer com que as pessoas gostem" },
      { letter: "O", text: "Fazer com que funcione" },
      { letter: "A", text: "Fazer com que aconteça" },
    ]),
  },
  {
    id: "q8", number: 8, title: "Eu prefiro...",
    options: makeOptions("q8", [
      { letter: "I", text: "Perguntas a respostas" },
      { letter: "O", text: "Ter todos os detalhes" },
      { letter: "A", text: "Vantagens a meu favor" },
      { letter: "C", text: "Que todos tenham a chance de ser ouvido" },
    ]),
  },
  {
    id: "q9", number: 9, title: "Eu gosto de...",
    options: makeOptions("q9", [
      { letter: "A", text: "Fazer progresso" },
      { letter: "C", text: "Construir memórias" },
      { letter: "O", text: "Fazer sentido" },
      { letter: "I", text: "Tornar as pessoas confortáveis" },
    ]),
  },
  {
    id: "q10", number: 10, title: "Eu gosto de chegar...",
    options: makeOptions("q10", [
      { letter: "A", text: "Na frente" },
      { letter: "C", text: "Junto" },
      { letter: "O", text: "Na hora" },
      { letter: "I", text: "Em outro lugar" },
    ]),
  },
  {
    id: "q11", number: 11, title: "Um ótimo dia para mim é quando...",
    options: makeOptions("q11", [
      { letter: "A", text: "Consigo fazer muitas coisas" },
      { letter: "C", text: "Me divirto com meus amigos" },
      { letter: "O", text: "Tudo segue conforme planejado" },
      { letter: "I", text: "Desfruto de coisas novas e estimulantes" },
    ]),
  },
  {
    id: "q12", number: 12, title: "Eu vejo a morte como...",
    options: makeOptions("q12", [
      { letter: "I", text: "Uma grande aventura misteriosa" },
      { letter: "C", text: "Oportunidade para rever os falecidos" },
      { letter: "O", text: "Um modo de receber recompensas" },
      { letter: "A", text: "Algo que sempre chega muito cedo" },
    ]),
  },
  {
    id: "q13", number: 13, title: "Minha filosofia de vida é...",
    options: makeOptions("q13", [
      { letter: "A", text: "Há ganhadores e perdedores, e eu acredito ser um ganhador" },
      { letter: "C", text: "Para eu ganhar, ninguém precisa perder" },
      { letter: "O", text: "Para ganhar é preciso seguir as regras" },
      { letter: "I", text: "Para ganhar, é necessário inventar novas regras" },
    ]),
  },
  {
    id: "q14", number: 14, title: "Eu sempre gostei de...",
    options: makeOptions("q14", [
      { letter: "I", text: "Explorar" },
      { letter: "O", text: "Evitar surpresas" },
      { letter: "A", text: "Focalizar a meta" },
      { letter: "C", text: "Realizar uma abordagem natural" },
    ]),
  },
  {
    id: "q15", number: 15, title: "Eu gosto de mudanças se...",
    options: makeOptions("q15", [
      { letter: "A", text: "Me der uma vantagem competitiva" },
      { letter: "C", text: "For divertido e puder ser compartilhado" },
      { letter: "I", text: "Me der mais liberdade e variedade" },
      { letter: "O", text: "Melhorar ou me der mais controle" },
    ]),
  },
  {
    id: "q16", number: 16, title: "Não existe nada de errado em...",
    options: makeOptions("q16", [
      { letter: "A", text: "Se colocar na frente" },
      { letter: "C", text: "Colocar os outros na frente" },
      { letter: "I", text: "Mudar de ideia" },
      { letter: "O", text: "Ser consistente" },
    ]),
  },
  {
    id: "q17", number: 17, title: "Eu gosto de buscar conselhos de...",
    options: makeOptions("q17", [
      { letter: "A", text: "Pessoas bem sucedidas" },
      { letter: "C", text: "Anciões e conselheiros" },
      { letter: "O", text: "Autoridades no assunto" },
      { letter: "I", text: "Lugares, os mais estranhos" },
    ]),
  },
  {
    id: "q18", number: 18, title: "Meu lema é...",
    options: makeOptions("q18", [
      { letter: "I", text: "Fazer o que precisa ser feito" },
      { letter: "O", text: "Fazer bem feito" },
      { letter: "C", text: "Fazer junto com o grupo" },
      { letter: "A", text: "Simplesmente fazer" },
    ]),
  },
  {
    id: "q19", number: 19, title: "Eu gosto de...",
    options: makeOptions("q19", [
      { letter: "I", text: "Complexidade, mesmo se confuso" },
      { letter: "O", text: "Ordem e sistematização" },
      { letter: "C", text: "Calor humano e animação" },
      { letter: "A", text: "Coisas claras e simples" },
    ]),
  },
  {
    id: "q20", number: 20, title: "Tempo para mim é...",
    options: makeOptions("q20", [
      { letter: "A", text: "Algo que detesto desperdiçar" },
      { letter: "C", text: "Um grande ciclo" },
      { letter: "O", text: "Uma flecha que leva ao inevitável" },
      { letter: "I", text: "Irrelevante" },
    ]),
  },
  {
    id: "q21", number: 21, title: "Se eu fosse bilionário...",
    options: makeOptions("q21", [
      { letter: "C", text: "Faria doações para muitas entidades" },
      { letter: "O", text: "Criaria uma poupança avantajada" },
      { letter: "I", text: "Faria o que desse na cabeça" },
      { letter: "A", text: "Exibiria bastante com algumas pessoas" },
    ]),
  },
  {
    id: "q22", number: 22, title: "Eu acredito que...",
    options: makeOptions("q22", [
      { letter: "A", text: "O destino é mais importante que a jornada" },
      { letter: "C", text: "A jornada é mais importante que o destino" },
      { letter: "O", text: "Um centavo economizado é um centavo ganho" },
      { letter: "I", text: "Bastam um navio e uma estrela para navegar" },
    ]),
  },
  {
    id: "q23", number: 23, title: "Eu acredito também que...",
    options: makeOptions("q23", [
      { letter: "A", text: "Aquele que hesita está perdido" },
      { letter: "O", text: "De grão em grão a galinha enche o papo" },
      { letter: "C", text: "O que vai, volta" },
      { letter: "I", text: "Um sorriso ou uma careta é o mesmo para quem é cego" },
    ]),
  },
  {
    id: "q24", number: 24, title: "Eu acredito ainda que...",
    options: makeOptions("q24", [
      { letter: "O", text: "É melhor prudência do que arrependimento" },
      { letter: "I", text: "A autoridade deve ser desafiada" },
      { letter: "A", text: "Ganhar é fundamental" },
      { letter: "C", text: "O coletivo é mais importante do que o individual" },
    ]),
  },
  {
    id: "q25", number: 25, title: "Eu penso que...",
    options: makeOptions("q25", [
      { letter: "I", text: "Não é fácil ficar encurralado" },
      { letter: "O", text: "É preferível olhar, antes de pular" },
      { letter: "C", text: "Duas cabeças pensam melhor do que uma" },
      { letter: "A", text: "Se você não tem condições de competir, não compita" },
    ]),
  },
];

export const TEMPERAMENTO_LABELS: Record<TemperamentoType, string> = {
  sanguineo: "Sanguíneo",
  fleumatico: "Fleumático",
  melancolico: "Melancólico",
  colerico: "Colérico",
};

export const TEMPERAMENTO_COLORS: Record<TemperamentoType, string> = {
  sanguineo: "hsl(33, 96%, 49%)",
  fleumatico: "hsl(160, 60%, 40%)",
  melancolico: "hsl(226, 88%, 57%)",
  colerico: "hsl(358, 84%, 56%)",
};

export const TOTAL_QUESTIONS = TEMPERAMENTO_QUESTIONS.length;
