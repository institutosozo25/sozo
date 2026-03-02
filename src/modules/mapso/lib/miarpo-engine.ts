import { DIMENSIONS, getRiskClassification, type RiskClassification } from "../data/miarpo-questionnaire";

export type Answers = Record<string, number>;

export interface DimensionResult {
  dimensionId: string;
  name: string;
  shortName: string;
  rawMean: number;
  standardizedScore: number;
  riskScore: number;
  classification: RiskClassification;
  weight: number;
}

export interface AssessmentResult {
  irp: number;
  irpClassification: RiskClassification;
  ipp: number;
  ivo: number;
  dimensions: DimensionResult[];
  totalRespondents: number;
  completedAt: string;
}

const standardize = (mean: number): number => ((mean - 1) / 4) * 100;

export const calculateAssessment = (answers: Answers): AssessmentResult => {
  const dimensionResults: DimensionResult[] = DIMENSIONS.map((dim) => {
    const itemScores = dim.items.map((item) => answers[item.id] ?? 3);
    const rawMean = itemScores.reduce((a, b) => a + b, 0) / itemScores.length;
    const standardizedScore = standardize(rawMean);
    const riskScore = dim.isInverted ? 100 - standardizedScore : standardizedScore;

    return {
      dimensionId: dim.id,
      name: dim.name,
      shortName: dim.shortName,
      rawMean,
      standardizedScore,
      riskScore,
      classification: getRiskClassification(riskScore),
      weight: dim.weight,
    };
  });

  const irp = dimensionResults.reduce((sum, d) => sum + d.riskScore * d.weight, 0);
  const ivo = dimensionResults.filter((d) => d.riskScore > 60).length;

  return {
    irp: Math.round(irp * 10) / 10,
    irpClassification: getRiskClassification(irp),
    ipp: Math.round((100 - irp) * 10) / 10,
    ivo,
    dimensions: dimensionResults,
    totalRespondents: 1,
    completedAt: new Date().toISOString(),
  };
};

export const generateDemoResult = (): AssessmentResult => {
  const demoAnswers: Answers = {};
  DIMENSIONS.forEach((dim) => {
    dim.items.forEach((item) => {
      const base = dim.isInverted ? 3.2 : 2.8;
      const variance = (Math.random() - 0.5) * 2;
      demoAnswers[item.id] = Math.max(1, Math.min(5, Math.round((base + variance) * 10) / 10));
    });
  });
  return { ...calculateAssessment(demoAnswers), totalRespondents: 147 };
};

export const getInterventionRecommendations = (result: AssessmentResult): string[] => {
  const critical = result.dimensions.filter((d) => d.riskScore > 60).sort((a, b) => b.riskScore - a.riskScore);
  const recommendations: string[] = [];

  for (const dim of critical) {
    switch (dim.dimensionId) {
      case "DP":
        recommendations.push("Reorganizar distribuição de carga de trabalho e revisar metas");
        break;
      case "CA":
        recommendations.push("Ampliar autonomia e participação dos colaboradores nas decisões");
        break;
      case "AS":
        recommendations.push("Fortalecer programas de liderança e comunicação organizacional");
        break;
      case "RR":
        recommendations.push("Implementar política de reconhecimento e plano de carreira");
        break;
      case "RI":
        recommendations.push("Mediação de conflitos e desenvolvimento de cultura de respeito");
        break;
      case "SP":
        recommendations.push("Treinamento de liderança para fomentar segurança psicológica");
        break;
      case "SE":
        recommendations.push("Programa urgente de saúde mental e prevenção de burnout");
        break;
      case "EN":
        recommendations.push("Estratégias de engajamento e alinhamento de propósito");
        break;
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Manter monitoramento preventivo e ações de promoção de bem-estar");
  }

  return recommendations;
};
