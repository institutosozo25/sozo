/**
 * MBTI Scoring Engine
 * Each A/B answer adds +1 to the corresponding pole.
 * The pole with more points in each dimension wins.
 */

import { MBTI_QUESTIONS, MBTI_TYPE_NAMES, TOTAL_QUESTIONS, type MbtiPole } from "../data/mbti-questionnaire";

export type MbtiAnswer = "A" | "B";
export type MbtiAnswers = Record<number, MbtiAnswer>; // questionId -> answer

export interface MbtiScores {
  E: number; I: number;
  S: number; N: number;
  T: number; F: number;
  J: number; P: number;
}

export interface MbtiResult {
  scores: MbtiScores;
  type: string; // e.g. "INTJ"
  typeName: string; // e.g. "O Arquiteto"
  dimensions: {
    EI: { winner: MbtiPole; E: number; I: number };
    SN: { winner: MbtiPole; S: number; N: number };
    TF: { winner: MbtiPole; T: number; F: number };
    JP: { winner: MbtiPole; J: number; P: number };
  };
  percentages: Record<string, number>;
}

export function calculateMbtiScores(answers: MbtiAnswers): MbtiResult {
  const scores: MbtiScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (const question of MBTI_QUESTIONS) {
    const answer = answers[question.id];
    if (!answer) continue;
    const pole = answer === "A" ? question.aMapping : question.bMapping;
    scores[pole] += 1;
  }

  const eiWinner: MbtiPole = scores.E >= scores.I ? "E" : "I";
  const snWinner: MbtiPole = scores.S >= scores.N ? "S" : "N";
  const tfWinner: MbtiPole = scores.T >= scores.F ? "T" : "F";
  const jpWinner: MbtiPole = scores.J >= scores.P ? "J" : "P";

  const type = `${eiWinner}${snWinner}${tfWinner}${jpWinner}`;
  const typeName = MBTI_TYPE_NAMES[type] || type;

  // Calculate percentages per dimension
  const eiTotal = scores.E + scores.I || 1;
  const snTotal = scores.S + scores.N || 1;
  const tfTotal = scores.T + scores.F || 1;
  const jpTotal = scores.J + scores.P || 1;

  const percentages: Record<string, number> = {
    E: Math.round((scores.E / eiTotal) * 100),
    I: Math.round((scores.I / eiTotal) * 100),
    S: Math.round((scores.S / snTotal) * 100),
    N: Math.round((scores.N / snTotal) * 100),
    T: Math.round((scores.T / tfTotal) * 100),
    F: Math.round((scores.F / tfTotal) * 100),
    J: Math.round((scores.J / jpTotal) * 100),
    P: Math.round((scores.P / jpTotal) * 100),
  };

  return {
    scores,
    type,
    typeName,
    dimensions: {
      EI: { winner: eiWinner, E: scores.E, I: scores.I },
      SN: { winner: snWinner, S: scores.S, N: scores.N },
      TF: { winner: tfWinner, T: scores.T, F: scores.F },
      JP: { winner: jpWinner, J: scores.J, P: scores.P },
    },
    percentages,
  };
}

export function isTestComplete(answers: MbtiAnswers): boolean {
  return Object.keys(answers).length === TOTAL_QUESTIONS;
}
