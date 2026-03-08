/**
 * DISC Scoring Engine
 * MOST choice = +1, LEAST choice = -1 for the profile of that option.
 */

import { DISC_QUESTION_GROUPS, PROFILE_LABELS, type DiscOption } from "../data/disc-questionnaire";

export interface DiscAnswer {
  most: string; // option id
  least: string; // option id
}

export type DiscAnswers = Record<string, DiscAnswer>; // groupId -> answer

export interface DiscScores {
  D: number;
  I: number;
  S: number;
  C: number;
}

export interface DiscResult {
  scores: DiscScores;
  primary: "D" | "I" | "S" | "C";
  secondary: "D" | "I" | "S" | "C";
  primaryLabel: string;
  secondaryLabel: string;
  percentages: Record<string, number>;
}

export function calculateDiscScores(answers: DiscAnswers): DiscResult {
  const scores: DiscScores = { D: 0, I: 0, S: 0, C: 0 };

  for (const group of DISC_QUESTION_GROUPS) {
    const answer = answers[group.id];
    if (!answer) continue;

    const mostOption = group.options.find((o) => o.id === answer.most);
    const leastOption = group.options.find((o) => o.id === answer.least);

    if (mostOption) scores[mostOption.profile] += 1;
    if (leastOption) scores[leastOption.profile] -= 1;
  }

  // Sort profiles by score descending
  const sorted = (Object.entries(scores) as [keyof DiscScores, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  const primary = sorted[0][0];
  const secondary = sorted[1][0];

  // Calculate percentages for chart display
  const total = Object.values(scores).reduce((s, v) => s + Math.max(v, 0), 0) || 1;
  const percentages: Record<string, number> = {};
  for (const [key, val] of Object.entries(scores)) {
    percentages[key] = Math.round((Math.max(val, 0) / total) * 100);
  }

  return {
    scores,
    primary,
    secondary,
    primaryLabel: PROFILE_LABELS[primary],
    secondaryLabel: PROFILE_LABELS[secondary],
    percentages,
  };
}

export function isTestComplete(answers: DiscAnswers): boolean {
  return DISC_QUESTION_GROUPS.every((g) => {
    const a = answers[g.id];
    return a && a.most && a.least && a.most !== a.least;
  });
}
