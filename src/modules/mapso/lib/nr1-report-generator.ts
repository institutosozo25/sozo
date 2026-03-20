import type { AssessmentResult, DimensionResult } from "./miarpo-engine";
import type { OrganizationInfo } from "../contexts/AssessmentContext";
import { generateActionPlan, type ActionPlanItem } from "./action-plan-generator";

export interface CompanyBranding {
  logoUrl?: string | null;
  cnpj?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
}

const getRiskLabel = (score: number): string => {
  if (score <= 20) return "Muito Baixo";
  if (score <= 40) return "Baixo";
  if (score <= 60) return "Moderado";
  if (score <= 80) return "Alto";
  return "Crítico";
};

const getRiskColor = (score: number): string => {
  if (score <= 20) return "#2ecc71";
  if (score <= 40) return "#52be80";
  if (score <= 60) return "#f39c12";
  if (score <= 80) return "#e67e22";
  return "#e74c3c";
};

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const buildBrandingBlock = (branding?: CompanyBranding): string => {
  if (!branding || (!branding.logoUrl && !branding.cnpj)) return "";
  const logo = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="Logo" style="max-height:60px;max-width:200px;object-fit:contain;margin-bottom:8px;" />`
    : "";
  const details = [
    branding.nomeFantasia || branding.razaoSocial,
    branding.cnpj ? `CNPJ: ${branding.cnpj}` : null,
  ].filter(Boolean).join(" · ");
  return `<div style="text-align:center;margin-bottom:20px;">${logo}${details ? `<p style="margin:4px 0 0;font-size:13px;opacity:0.85;">${details}</p>` : ""}</div>`;
};

export const generateDiagnosisHtml = (
  result: AssessmentResult,
  organization: OrganizationInfo,
  branding?: CompanyBranding
): string => {
  const dimRows = result.dimensions
    .map(
      (d) => `
    <tr>
      <td style="padding:10px;border:1px solid #ddd;font-weight:600;">${d.name}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">${Math.round(d.riskScore)}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">
        <span style="background:${d.classification.color}20;color:${d.classification.color};padding:4px 12px;border-radius:20px;font-weight:600;font-size:13px;">
          ${d.classification.label}
        </span>
      </td>
      <td style="padding:10px;border:1px solid #ddd;font-size:13px;color:#666;">${d.classification.description}</td>
    </tr>`
    )
    .join("");

  return `
<div style="max-width:800px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;line-height:1.7;">
  ${buildBrandingBlock(branding)}
  <div style="text-align:center;padding:30px;background:linear-gradient(135deg,#0f3460,#533483);color:white;border-radius:12px;margin-bottom:30px;">
    <h1 style="margin:0 0 8px;font-size:24px;">DIAGNÓSTICO PSICOSSOCIAL — MAPSO</h1>
    <p style="margin:0;opacity:0.9;">${organization.name} · ${organization.sector}</p>
    <p style="margin:4px 0 0;opacity:0.7;font-size:14px;">Gerado em ${formatDate(result.completedAt)}</p>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr>
      <td style="width:33%;padding:8px;vertical-align:top;">
        <div style="padding:20px;border-radius:12px;border:2px solid ${getRiskColor(result.irp)};text-align:center;">
          <div style="font-size:14px;color:#666;margin-bottom:4px;">Índice de Risco (IRP)</div>
          <div style="font-size:36px;font-weight:700;color:${getRiskColor(result.irp)};">${result.irp}</div>
          <div style="font-size:13px;font-weight:600;color:${getRiskColor(result.irp)};">${result.irpClassification.label}</div>
        </div>
      </td>
      <td style="width:33%;padding:8px;vertical-align:top;">
        <div style="padding:20px;border-radius:12px;border:2px solid #2ecc71;text-align:center;">
          <div style="font-size:14px;color:#666;margin-bottom:4px;">Índice de Proteção (IPP)</div>
          <div style="font-size:36px;font-weight:700;color:#2ecc71;">${result.ipp}</div>
          <div style="font-size:13px;color:#666;">100 − IRP</div>
        </div>
      </td>
      <td style="width:33%;padding:8px;vertical-align:top;">
        <div style="padding:20px;border-radius:12px;border:2px solid ${result.ivo >= 3 ? '#e74c3c' : '#f39c12'};text-align:center;">
          <div style="font-size:14px;color:#666;margin-bottom:4px;">Vulnerabilidade (IVO)</div>
          <div style="font-size:36px;font-weight:700;color:${result.ivo >= 3 ? '#e74c3c' : '#f39c12'};">${result.ivo}/8</div>
          <div style="font-size:13px;color:#666;">Dimensões > 60 pts</div>
        </div>
      </td>
    </tr>
  </table>

  <h2 style="color:#0f3460;border-bottom:2px solid #0f3460;padding-bottom:8px;">Resultados por Dimensão</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <thead>
      <tr style="background:#f8f9fa;">
        <th style="padding:10px;border:1px solid #ddd;text-align:left;">Dimensão</th>
        <th style="padding:10px;border:1px solid #ddd;text-align:center;">Score</th>
        <th style="padding:10px;border:1px solid #ddd;text-align:center;">Classificação</th>
        <th style="padding:10px;border:1px solid #ddd;text-align:left;">Observação</th>
      </tr>
    </thead>
    <tbody>${dimRows}</tbody>
  </table>

  <h2 style="color:#0f3460;border-bottom:2px solid #0f3460;padding-bottom:8px;">Classificação NR1</h2>
  <p>Com base na avaliação realizada, a organização <strong>${organization.name}</strong> apresenta nível de risco psicossocial 
  classificado como <strong style="color:${getRiskColor(result.irp)};">${result.irpClassification.label}</strong> (IRP: ${result.irp}/100).</p>
  <p>${result.irpClassification.description}</p>

  <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #e0e0e0;color:#888;font-size:12px;">
    <p>© Instituto Plenitude SOZO — Diagnóstico gerado automaticamente via MAPSO</p>
  </div>
</div>`;
};

export const generateNR1ReportHtml = (
  result: AssessmentResult,
  organization: OrganizationInfo,
  branding?: CompanyBranding
): string => {
  const actionPlan = generateActionPlan(result);
  const criticalDims = result.dimensions.filter((d) => d.riskScore > 60).sort((a, b) => b.riskScore - a.riskScore);
  const moderateDims = result.dimensions.filter((d) => d.riskScore > 40 && d.riskScore <= 60);
  const healthyDims = result.dimensions.filter((d) => d.riskScore <= 40);

  const actionRows = actionPlan
    .map(
      (a, i) => `
    <tr>
      <td style="padding:10px;border:1px solid #ddd;">${i + 1}</td>
      <td style="padding:10px;border:1px solid #ddd;font-weight:600;">${a.riskFactor}</td>
      <td style="padding:10px;border:1px solid #ddd;">${a.recommendedAction}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">${a.responsible}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">${a.deadline}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center;">
        <span style="background:${a.priority === 'Urgente' ? '#e74c3c' : a.priority === 'Alta' ? '#e67e22' : '#f39c12'}20;color:${a.priority === 'Urgente' ? '#e74c3c' : a.priority === 'Alta' ? '#e67e22' : '#f39c12'};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${a.priority}</span>
      </td>
    </tr>`
    )
    .join("");

  const dimAnalysis = (dims: DimensionResult[], label: string, emoji: string) =>
    dims.length > 0
      ? `<p>${emoji} <strong>${label}:</strong> ${dims.map((d) => `${d.name} (${Math.round(d.riskScore)} pts)`).join(", ")}</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Relatório NR1 — ${organization.name}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.7; }
  h1 { color: #16213e; border-bottom: 3px solid #0f3460; padding-bottom: 10px; font-size: 22px; }
  h2 { color: #0f3460; margin-top: 30px; font-size: 18px; }
  h3 { color: #533483; font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  th, td { padding: 10px; border: 1px solid #ddd; }
  th { background: #f8f9fa; text-align: left; font-weight: 600; }
  .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #0f3460, #533483); color: white; border-radius: 12px; }
  .header h1 { color: white; border: none; margin: 0; font-size: 20px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #888; font-size: 12px; }
  .signature { margin-top: 60px; text-align: center; }
  .signature-line { border-top: 1px solid #333; width: 300px; margin: 0 auto 8px; }
  @media print { body { padding: 20px; } .header { break-after: avoid; } }
</style></head>
<body>
  <div class="header">
    ${branding?.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" style="max-height:50px;max-width:180px;object-fit:contain;margin-bottom:12px;" />` : ""}
    <h1>RELATÓRIO FINAL — AVALIAÇÃO DE RISCOS PSICOSSOCIAIS</h1>
    <p style="margin:8px 0 0;opacity:0.9;">Em conformidade com a NR-1 e NR-17</p>
    ${branding?.cnpj || branding?.razaoSocial ? `<p style="margin:4px 0 0;opacity:0.8;font-size:13px;">${[branding.razaoSocial, branding.cnpj ? 'CNPJ: ' + branding.cnpj : null].filter(Boolean).join(' · ')}</p>` : ""}
  </div>

  <table>
    <tr><td style="font-weight:600;width:200px;">Empresa</td><td>${organization.name}</td></tr>
    <tr><td style="font-weight:600;">Setor</td><td>${organization.sector}</td></tr>
    ${organization.department ? `<tr><td style="font-weight:600;">Departamento</td><td>${organization.department}</td></tr>` : ""}
    <tr><td style="font-weight:600;">Nº de Colaboradores</td><td>${organization.employeeCount || "N/I"}</td></tr>
    <tr><td style="font-weight:600;">Data</td><td>${formatDate(result.completedAt)}</td></tr>
    <tr><td style="font-weight:600;">Responsável Técnico</td><td>Everton Nunes de Oliveira</td></tr>
    <tr><td style="font-weight:600;">Registro Profissional</td><td>Psicanalista Clínico (Certificado 127400 PS)<br/>Analista Comportamental e Coach (IBC / ISO 9001)</td></tr>
  </table>

  <h1>1. Introdução e Objetivos</h1>
  <p>O presente relatório tem como objetivo identificar, avaliar e mitigar os fatores de risco psicossociais que podem afetar a saúde mental e física dos colaboradores da empresa <strong>${organization.name}</strong>, em conformidade com o PGR (Programa de Gerenciamento de Riscos) e as exigências da NR-1 atualizada (Portaria MTE nº 1.419/2024).</p>
  <p>A avaliação foi realizada garantindo o anonimato de todos os participantes, utilizando o instrumento MAPSO — Modelo de Avaliação e Gestão de Riscos Psicossociais Organizacionais, desenvolvido pelo Instituto Plenitude SOZO.</p>

  <h1>2. Metodologia</h1>
  <p><strong>Instrumento:</strong> Questionário MAPSO padronizado com 64 itens distribuídos em 8 dimensões psicossociais, baseado nos modelos de Karasek (Demanda-Controle), Siegrist (Esforço-Recompensa) e Maslach (Burnout).</p>
  <p><strong>Escala:</strong> Likert de 5 pontos (Nunca a Sempre), com itens diretos e invertidos.</p>
  <p><strong>Métodos Complementares:</strong> Análise comportamental e observação do ambiente organizacional.</p>
  <p><strong>Amparo Legal:</strong> CBO 2515-50 e Parecer 159/2000 do MPF.</p>

  <h1>3. Perfil da Amostra</h1>
  <p>Total de respondentes: <strong>${result.totalRespondents}</strong> colaborador(es).</p>
  <p>Setor de atuação: <strong>${organization.sector}</strong>.</p>
  ${organization.department ? `<p>Departamento avaliado: <strong>${organization.department}</strong>.</p>` : ""}

  <h1>4. Resultados da Avaliação (Diagnóstico)</h1>
  <p>Os fatores foram classificados conforme a escala de risco padronizada:</p>
  <table>
    <thead>
      <tr><th>Dimensão</th><th style="text-align:center;">Score</th><th style="text-align:center;">Classificação</th><th>Peso</th></tr>
    </thead>
    <tbody>
      ${result.dimensions.map((d) => `
      <tr>
        <td>${d.name}</td>
        <td style="text-align:center;font-weight:700;color:${d.classification.color};">${Math.round(d.riskScore)}</td>
        <td style="text-align:center;"><span style="background:${d.classification.color}20;color:${d.classification.color};padding:3px 10px;border-radius:12px;font-size:13px;font-weight:600;">${d.classification.label}</span></td>
        <td>${(d.weight * 100).toFixed(0)}%</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <p><strong>Índice de Risco Psicossocial (IRP):</strong> <span style="color:${getRiskColor(result.irp)};font-weight:700;font-size:18px;">${result.irp}</span> — ${result.irpClassification.label}</p>
  <p><strong>Índice de Proteção Psicossocial (IPP):</strong> ${result.ipp}</p>
  <p><strong>Índice de Vulnerabilidade Organizacional (IVO):</strong> ${result.ivo}/8 dimensões em risco elevado</p>

  <h1>5. Análise Crítica</h1>
  ${dimAnalysis(criticalDims, "Fatores de risco ALTO/CRÍTICO", "🔴")}
  ${dimAnalysis(moderateDims, "Fatores de atenção MODERADA", "🟡")}
  ${dimAnalysis(healthyDims, "Fatores saudáveis", "🟢")}
  
  ${criticalDims.length > 0 ? `
  <p>A análise indica um cenário que exige intervenção organizacional. ${
    criticalDims.some((d) => d.dimensionId === "SE")
      ? "Do ponto de vista da saúde emocional, a organização apresenta indicadores significativos de esgotamento mental, elevando o risco de Burnout."
      : ""
  } ${
    criticalDims.some((d) => d.dimensionId === "DP")
      ? "A sobrecarga de demandas psicológicas contribui para um cenário de fadiga por decisão."
      : ""
  } ${
    criticalDims.some((d) => d.dimensionId === "RR")
      ? "A percepção de falta de reconhecimento fragiliza o vínculo do colaborador com a organização."
      : ""
  }</p>` : `<p>A organização apresenta indicadores dentro de faixas aceitáveis. Recomenda-se manter o monitoramento preventivo e ações de promoção de bem-estar.</p>`}

  <h1>6. Plano de Ação</h1>
  <p>Com base nos riscos identificados, recomenda-se as seguintes ações:</p>
  <table>
    <thead>
      <tr><th>#</th><th>Fator de Risco</th><th>Ação Recomendada</th><th style="text-align:center;">Responsável</th><th style="text-align:center;">Prazo</th><th style="text-align:center;">Prioridade</th></tr>
    </thead>
    <tbody>${actionRows}</tbody>
  </table>

  <h1>7. Conclusão</h1>
  <p>A avaliação de riscos psicossociais realizada na empresa <strong>${organization.name}</strong> evidenciou um nível geral de risco classificado como <strong style="color:${getRiskColor(result.irp)};">${result.irpClassification.label}</strong> (IRP: ${result.irp}/100).</p>
  ${result.irp > 60
    ? `<p>Os resultados exigem intervenção imediata para evitar adoecimentos ocupacionais (Burnout, ansiedade, depressão). A implementação das ações propostas no item 6 é fundamental para a conformidade legal e proteção da saúde do trabalhador.</p>`
    : result.irp > 40
    ? `<p>Recomenda-se atenção preventiva e implementação gradual das ações propostas para manter o ambiente de trabalho saudável e em conformidade com a NR1.</p>`
    : `<p>A organização demonstra boas práticas de gestão psicossocial. Recomenda-se manter o monitoramento periódico e as ações de promoção de bem-estar.</p>`
  }

  <div class="signature">
    <div class="signature-line"></div>
    <p style="margin:0;font-weight:600;">Everton Nunes de Oliveira</p>
    <p style="margin:4px 0 0;font-size:13px;color:#666;">Psicanalista Clínico (Certificado 127400 PS)</p>
    <p style="margin:2px 0 0;font-size:13px;color:#666;">Analista Comportamental e Coach (IBC / ISO 9001)</p>
  </div>

  <div class="footer">
    <p>© Instituto Plenitude SOZO — Relatório gerado automaticamente via MAPSO</p>
    <p>Este documento integra o PGR conforme NR-1 (Portaria MTE nº 1.419/2024)</p>
  </div>
</body></html>`;
};
