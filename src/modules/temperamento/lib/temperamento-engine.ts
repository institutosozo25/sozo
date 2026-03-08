/**
 * Temperamento Scoring Engine
 * Each answer adds +1 to the corresponding temperament.
 */

import { TEMPERAMENTO_QUESTIONS, TEMPERAMENTO_LABELS, TOTAL_QUESTIONS, type TemperamentoType } from "../data/temperamento-questionnaire";

export type TemperamentoAnswers = Record<string, string>; // questionId -> optionId

export interface TemperamentoScores {
  sanguineo: number;
  fleumatico: number;
  melancolico: number;
  colerico: number;
}

export interface TemperamentoResult {
  scores: TemperamentoScores;
  percentages: Record<TemperamentoType, number>;
  primary: TemperamentoType;
  secondary: TemperamentoType;
  tertiary: TemperamentoType;
  quaternary: TemperamentoType;
  primaryLabel: string;
  secondaryLabel: string;
}

export function calculateTemperamentoScores(answers: TemperamentoAnswers): TemperamentoResult {
  const scores: TemperamentoScores = { sanguineo: 0, fleumatico: 0, melancolico: 0, colerico: 0 };

  for (const question of TEMPERAMENTO_QUESTIONS) {
    const selectedOptionId = answers[question.id];
    if (!selectedOptionId) continue;
    const option = question.options.find((o) => o.id === selectedOptionId);
    if (option) {
      scores[option.temperamento] += 1;
    }
  }

  const sorted = (Object.entries(scores) as [TemperamentoType, number][]).sort((a, b) => b[1] - a[1]);

  const percentages = {} as Record<TemperamentoType, number>;
  for (const [key, val] of Object.entries(scores)) {
    percentages[key as TemperamentoType] = Math.round((val / TOTAL_QUESTIONS) * 100);
  }

  return {
    scores,
    percentages,
    primary: sorted[0][0],
    secondary: sorted[1][0],
    tertiary: sorted[2][0],
    quaternary: sorted[3][0],
    primaryLabel: TEMPERAMENTO_LABELS[sorted[0][0]],
    secondaryLabel: TEMPERAMENTO_LABELS[sorted[1][0]],
  };
}

export function isTestComplete(answers: TemperamentoAnswers): boolean {
  return Object.keys(answers).length === TOTAL_QUESTIONS;
}
