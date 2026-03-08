import { ENEAGRAMA_QUESTIONS, ENEAGRAMA_TYPE_NAMES, type EneagramaType } from "../data/eneagrama-questionnaire";

export type EneagramaAnswers = Record<string, number>; // questionId -> 1-5

export interface EneagramaResult {
  scores: Record<EneagramaType, number>;
  percentages: Record<EneagramaType, number>;
  dominant: EneagramaType;
  dominantName: string;
  wing: EneagramaType;
  wingName: string;
  top3: { type: EneagramaType; name: string; score: number; percentage: number }[];
}

const WINGS: Record<EneagramaType, [EneagramaType, EneagramaType]> = {
  1: [9, 2],
  2: [1, 3],
  3: [2, 4],
  4: [3, 5],
  5: [4, 6],
  6: [5, 7],
  7: [6, 8],
  8: [7, 9],
  9: [8, 1],
};

export function calculateEneagramaScores(answers: EneagramaAnswers): EneagramaResult {
  const scores: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  for (const q of ENEAGRAMA_QUESTIONS) {
    const val = answers[q.id];
    if (val) scores[q.type] += val;
  }

  // Max possible per type = 15 * 5 = 75
  const percentages: Record<number, number> = {};
  for (let t = 1; t <= 9; t++) {
    percentages[t] = Math.round((scores[t] / 75) * 100);
  }

  // Sort to find dominant
  const sorted = ([1, 2, 3, 4, 5, 6, 7, 8, 9] as EneagramaType[])
    .map((t) => ({ type: t, score: scores[t], percentage: percentages[t] }))
    .sort((a, b) => b.score - a.score);

  const dominant = sorted[0].type;

  // Determine wing
  const [wingA, wingB] = WINGS[dominant];
  const wing = scores[wingA] >= scores[wingB] ? wingA : wingB;

  const top3 = sorted.slice(0, 3).map((s) => ({
    ...s,
    name: ENEAGRAMA_TYPE_NAMES[s.type],
  }));

  return {
    scores: scores as Record<EneagramaType, number>,
    percentages: percentages as Record<EneagramaType, number>,
    dominant,
    dominantName: ENEAGRAMA_TYPE_NAMES[dominant],
    wing,
    wingName: ENEAGRAMA_TYPE_NAMES[wing],
    top3,
  };
}

export function isTestComplete(answers: EneagramaAnswers): boolean {
  return Object.keys(answers).length >= ENEAGRAMA_QUESTIONS.length;
}
