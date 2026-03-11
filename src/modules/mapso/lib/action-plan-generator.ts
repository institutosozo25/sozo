import type { AssessmentResult } from "./miarpo-engine";

export interface ActionPlanItem {
  riskFactor: string;
  dimensionId: string;
  score: number;
  recommendedAction: string;
  responsible: string;
  deadline: string;
  priority: "Urgente" | "Alta" | "Moderada";
}

const ACTION_MAP: Record<string, { actions: string[]; responsible: string }> = {
  DP: {
    actions: [
      "Revisão de metas e redistribuição de carga de trabalho",
      "Implementação de pausas ativas e gestão de tempo",
      "Avaliação de fluxo de processos para eliminação de gargalos",
    ],
    responsible: "RH / Gestão",
  },
  CA: {
    actions: [
      "Ampliação da autonomia dos colaboradores nas decisões",
      "Programa de delegação e empowerment",
      "Revisão de processos de aprovação para maior agilidade",
    ],
    responsible: "Liderança",
  },
  AS: {
    actions: [
      "Fortalecimento dos canais de comunicação organizacional",
      "Programa de mentoria e suporte entre pares",
      "Treinamento de liderança em comunicação empática",
    ],
    responsible: "RH / Liderança",
  },
  RR: {
    actions: [
      "Programa de feedback estruturado e reconhecimento",
      "Revisão de plano de carreira e critérios de promoção",
      "Implementação de programa de valorização do colaborador",
    ],
    responsible: "RH / Diretoria",
  },
  RI: {
    actions: [
      "Mediação de conflitos e treinamento em relações interpessoais",
      "Código de conduta e canal de denúncias",
      "Workshops de convivência e respeito mútuo",
    ],
    responsible: "RH / Jurídico",
  },
  SP: {
    actions: [
      "Treinamento de liderança para fomentar segurança psicológica",
      "Criação de espaços seguros de diálogo e feedback",
      "Política de tolerância ao erro construtivo",
    ],
    responsible: "Liderança / RH",
  },
  SE: {
    actions: [
      "Programa de saúde mental e prevenção de burnout",
      "Disponibilização de apoio psicológico (EAP)",
      "Revisão de jornadas e flexibilidade de trabalho",
    ],
    responsible: "RH / Saúde Ocupacional",
  },
  EN: {
    actions: [
      "Estratégias de engajamento e alinhamento de propósito",
      "Pesquisa de clima e plano de ação participativo",
      "Programa de desenvolvimento de carreira e capacitação",
    ],
    responsible: "RH / Gestão",
  },
};

export const generateActionPlan = (result: AssessmentResult): ActionPlanItem[] => {
  const plan: ActionPlanItem[] = [];

  const sortedDims = [...result.dimensions].sort((a, b) => b.riskScore - a.riskScore);

  for (const dim of sortedDims) {
    if (dim.riskScore <= 40) continue;

    const mapping = ACTION_MAP[dim.dimensionId];
    if (!mapping) continue;

    const isCritical = dim.riskScore > 80;
    const isHigh = dim.riskScore > 60;

    const priority: ActionPlanItem["priority"] = isCritical ? "Urgente" : isHigh ? "Alta" : "Moderada";
    const deadline = isCritical ? "15 dias" : isHigh ? "30 dias" : "60 dias";

    // Pick the most relevant action based on severity
    const actionIndex = isCritical ? 0 : isHigh ? 0 : 1;
    const action = mapping.actions[Math.min(actionIndex, mapping.actions.length - 1)];

    plan.push({
      riskFactor: dim.name,
      dimensionId: dim.dimensionId,
      score: Math.round(dim.riskScore),
      recommendedAction: action,
      responsible: mapping.responsible,
      deadline,
      priority,
    });

    // For critical/high risk, add secondary action
    if (isHigh && mapping.actions.length > 1) {
      plan.push({
        riskFactor: dim.name,
        dimensionId: dim.dimensionId,
        score: Math.round(dim.riskScore),
        recommendedAction: mapping.actions[1],
        responsible: mapping.responsible,
        deadline: isCritical ? "30 dias" : "45 dias",
        priority: isCritical ? "Alta" : "Moderada",
      });
    }
  }

  if (plan.length === 0) {
    plan.push({
      riskFactor: "Monitoramento Preventivo",
      dimensionId: "ALL",
      score: 0,
      recommendedAction: "Manter acompanhamento periódico e ações de promoção de bem-estar",
      responsible: "RH",
      deadline: "Contínuo",
      priority: "Moderada",
    });
  }

  return plan;
};
