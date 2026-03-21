/**
 * Searchable PDF Generator
 * Generates real text-based PDFs (searchable, accessible, smaller file size).
 * Replaces image-based html2pdf.js approach.
 * Supports company branding/logos for enterprise accounts.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

// ─── Constants ───────────────────────────────────────────────────────────────
const A4 = { width: 210, height: 297 };
const M = { top: 15, bottom: 22, left: 18, right: 18 };
const CW = A4.width - M.left - M.right; // content width

const C = {
  headerBg: [15, 52, 96] as const,
  headerBg2: [83, 52, 131] as const,
  h1: [15, 52, 96] as const,
  h2: [83, 52, 131] as const,
  h3: [40, 40, 80] as const,
  text: [50, 50, 50] as const,
  muted: [130, 130, 130] as const,
  white: [255, 255, 255] as const,
  border: [200, 200, 200] as const,
  bullet: [83, 52, 131] as const,
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface ScoreItem {
  label: string;
  value: string;
  color: string; // hex
}

export interface TestReportConfig {
  title: string;
  subtitle: string;
  extra?: string;
  respondentName: string;
  scores: ScoreItem[];
  content: string; // raw markdown from AI
  logoBase64?: string | null;
  companyName?: string | null;
  companyCnpj?: string | null;
}

export interface MapsoPdfData {
  organizationName: string;
  organizationSector: string | null;
  organizationDepartment?: string | null;
  employeeCount?: number | null;
  irp: number;
  ipp: number;
  ivo: number;
  irpClassification: string;
  dimensionScores: any[];
  actionPlan?: any[];
  createdAt: string;
}

export interface BrandingInfo {
  logoBase64: string | null;
  companyName: string | null;
  companyCnpj: string | null;
}

// ─── Utilities ───────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/`(.+?)`/g, '$1');
}

function sanitizeText(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/\u{200B}/gu, '');
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Markdown Parser ─────────────────────────────────────────────────────────
interface Block { type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'hr'; text: string; }

function parseContent(raw: string): Block[] {
  // Convert HTML tags to markdown if content is HTML
  let content = raw
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(?:ul|ol|div|span|table|tr|td|th|thead|tbody)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  const blocks: Block[] = [];
  const lines = content.split('\n');
  let para = '';

  const flushPara = () => {
    if (para.trim()) {
      blocks.push({ type: 'p', text: para.trim() });
      para = '';
    }
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushPara(); continue; }

    if (t.startsWith('### ')) { flushPara(); blocks.push({ type: 'h3', text: t.slice(4) }); }
    else if (t.startsWith('## ')) { flushPara(); blocks.push({ type: 'h2', text: t.slice(3) }); }
    else if (t.startsWith('# ')) { flushPara(); blocks.push({ type: 'h1', text: t.slice(2) }); }
    else if (/^[-•*]\s+/.test(t)) { flushPara(); blocks.push({ type: 'li', text: t.replace(/^[-•*]\s+/, '') }); }
    else if (/^\d+\.\s+/.test(t)) { flushPara(); blocks.push({ type: 'li', text: t.replace(/^\d+\.\s+/, '') }); }
    else if (t === '---' || t === '***') { flushPara(); blocks.push({ type: 'hr', text: '' }); }
    else { para += (para ? ' ' : '') + t; }
  }
  flushPara();
  return blocks;
}

// ─── Fetch Empresa Branding ──────────────────────────────────────────────────
export async function fetchEmpresaBranding(userId: string): Promise<BrandingInfo> {
  try {
    const { data } = await supabase
      .from('empresas')
      .select('logo_url, nome_fantasia, razao_social, cnpj')
      .eq('profile_id', userId)
      .single();

    if (!data) return { logoBase64: null, companyName: null, companyCnpj: null };

    const logoBase64 = data.logo_url ? await loadImageAsBase64(data.logo_url) : null;
    return {
      logoBase64,
      companyName: data.nome_fantasia || data.razao_social || null,
      companyCnpj: data.cnpj || null,
    };
  } catch {
    return { logoBase64: null, companyName: null, companyCnpj: null };
  }
}

// ─── Core PDF Builder ────────────────────────────────────────────────────────
class PdfDoc {
  doc: jsPDF;
  y: number = M.top;
  page: number = 1;

  constructor() {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.doc.setFont('helvetica');
  }

  ensureSpace(h: number) {
    if (this.y + h > A4.height - M.bottom) {
      this.addPageFooter();
      this.doc.addPage();
      this.page++;
      this.y = M.top;
    }
  }

  addPageFooter() {
    this.doc.setFontSize(7);
    this.doc.setTextColor(...C.muted);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      '\u00A9 Instituto Plenitude SOZO \u2014 Relat\u00F3rio gerado automaticamente',
      A4.width / 2, A4.height - 10, { align: 'center' }
    );
    this.doc.text(`${this.page}`, A4.width - M.right, A4.height - 10, { align: 'right' });
  }

  addBranding(branding?: { logoBase64?: string | null; companyName?: string | null; companyCnpj?: string | null }) {
    if (!branding) return;
    if (branding.logoBase64) {
      try {
        this.doc.addImage(branding.logoBase64, 'PNG', A4.width / 2 - 18, this.y, 36, 14, undefined, 'FAST');
        this.y += 16;
      } catch { /* skip */ }
    }
    if (branding.companyName) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(...C.muted);
      this.doc.setFont('helvetica', 'normal');
      const line = branding.companyCnpj ? `${branding.companyName} \u00B7 CNPJ: ${branding.companyCnpj}` : branding.companyName;
      this.doc.text(line, A4.width / 2, this.y, { align: 'center' });
      this.y += 5;
    }
  }

  addHeader(title: string, subtitle: string, respondentName: string, extra?: string) {
    const h = extra ? 42 : 36;
    this.doc.setFillColor(...C.headerBg);
    this.doc.roundedRect(M.left, this.y, CW, h, 3, 3, 'F');

    this.doc.setTextColor(...C.white);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(15);
    this.doc.text(sanitizeText(title), A4.width / 2, this.y + 11, { align: 'center' });

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sanitizeText(subtitle), A4.width / 2, this.y + 19, { align: 'center' });

    let infoY = extra ? this.y + 26 : this.y + 26;
    if (extra) {
      this.doc.setFontSize(9);
      this.doc.text(sanitizeText(extra), A4.width / 2, this.y + 26, { align: 'center' });
      infoY = this.y + 33;
    }

    this.doc.setFontSize(8);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    this.doc.text(`${sanitizeText(respondentName)} \u00B7 ${dateStr}`, A4.width / 2, infoY, { align: 'center' });

    this.y += h + 8;
  }

  addScores(scores: ScoreItem[]) {
    if (!scores.length) return;
    const isMany = scores.length > 6;
    const circleR = isMany ? 5.5 : 8;
    const scoreW = Math.min(CW / scores.length, isMany ? 19 : 28);
    const totalW = scoreW * scores.length;
    const startX = M.left + (CW - totalW) / 2;

    this.ensureSpace(circleR * 2 + 14);

    scores.forEach((s, i) => {
      const cx = startX + scoreW * i + scoreW / 2;
      const cy = this.y + circleR;
      const [r, g, b] = hexToRgb(s.color);

      this.doc.setFillColor(r, g, b);
      this.doc.circle(cx, cy, circleR, 'F');

      this.doc.setTextColor(...C.white);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(isMany ? 7 : 9);
      this.doc.text(s.value, cx, cy + (isMany ? 0.8 : 1.2), { align: 'center' });

      this.doc.setTextColor(...C.muted);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(isMany ? 5.5 : 6.5);
      const lblLines = this.doc.splitTextToSize(sanitizeText(s.label), scoreW - 2);
      this.doc.text(lblLines, cx, cy + circleR + 3, { align: 'center' });
    });

    this.y += circleR * 2 + 14;

    // separator
    this.doc.setDrawColor(...C.border);
    this.doc.line(M.left, this.y, A4.width - M.right, this.y);
    this.y += 5;
  }

  addMarkdownContent(content: string) {
    const blocks = parseContent(content);
    const LH = { h1: 6, h2: 5.5, h3: 5, p: 4.2, li: 4.2 };

    for (const block of blocks) {
      const text = sanitizeText(stripMarkdown(block.text));
      if (!text && block.type !== 'hr') continue;

      switch (block.type) {
        case 'h1': {
          this.ensureSpace(14);
          this.y += 3;
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(13);
          this.doc.setTextColor(...C.h1);
          const lines = this.doc.splitTextToSize(text, CW);
          this.doc.text(lines, M.left, this.y);
          this.y += lines.length * LH.h1 + 1;
          this.doc.setDrawColor(...C.border);
          this.doc.line(M.left, this.y, A4.width - M.right, this.y);
          this.y += 4;
          break;
        }
        case 'h2': {
          this.ensureSpace(12);
          this.y += 2;
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(11.5);
          this.doc.setTextColor(...C.h2);
          const lines = this.doc.splitTextToSize(text, CW);
          this.doc.text(lines, M.left, this.y);
          this.y += lines.length * LH.h2 + 3;
          break;
        }
        case 'h3': {
          this.ensureSpace(10);
          this.y += 1;
          this.doc.setFont('helvetica', 'bold');
          this.doc.setFontSize(10.5);
          this.doc.setTextColor(...C.h3);
          const lines = this.doc.splitTextToSize(text, CW);
          this.doc.text(lines, M.left, this.y);
          this.y += lines.length * LH.h3 + 2;
          break;
        }
        case 'p': {
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(9.5);
          this.doc.setTextColor(...C.text);
          const lines = this.doc.splitTextToSize(text, CW);
          for (const line of lines) {
            this.ensureSpace(LH.p + 1);
            this.doc.text(line, M.left, this.y);
            this.y += LH.p;
          }
          this.y += 2;
          break;
        }
        case 'li': {
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(9.5);
          this.doc.setTextColor(...C.text);
          const liLines = this.doc.splitTextToSize(text, CW - 7);
          this.ensureSpace(liLines.length * LH.li + 1);

          this.doc.setFillColor(...C.bullet);
          this.doc.circle(M.left + 2, this.y - 1, 0.7, 'F');

          for (const line of liLines) {
            this.doc.text(line, M.left + 6, this.y);
            this.y += LH.li;
          }
          this.y += 0.5;
          break;
        }
        case 'hr': {
          this.ensureSpace(6);
          this.doc.setDrawColor(...C.border);
          this.doc.line(M.left, this.y, A4.width - M.right, this.y);
          this.y += 4;
          break;
        }
      }
    }
  }

  save(filename: string) {
    this.addPageFooter();
    this.doc.save(filename);
  }
}

// ─── Public API: Personality Test Report PDF ─────────────────────────────────
export async function downloadTestReportPdf(config: TestReportConfig, filename: string): Promise<void> {
  const pdf = new PdfDoc();

  pdf.addBranding({
    logoBase64: config.logoBase64,
    companyName: config.companyName,
    companyCnpj: config.companyCnpj,
  });

  pdf.addHeader(config.title, config.subtitle, config.respondentName, config.extra);
  pdf.addScores(config.scores);
  pdf.addMarkdownContent(config.content);
  pdf.save(filename);
}

// ─── Public API: MAPSO Diagnosis PDF ─────────────────────────────────────────
function getRiskColor(score: number): string {
  if (score <= 20) return '#2ecc71';
  if (score <= 40) return '#52be80';
  if (score <= 60) return '#f39c12';
  if (score <= 80) return '#e67e22';
  return '#e74c3c';
}

export async function downloadMapsoDiagnosisPdf(data: MapsoPdfData, branding?: BrandingInfo): Promise<void> {
  const pdf = new PdfDoc();
  const { doc } = pdf;

  pdf.addBranding(branding);
  pdf.addHeader(
    'DIAGN\u00D3STICO PSICOSSOCIAL \u2014 MAPSO',
    `${sanitizeText(data.organizationName)} \u00B7 ${data.organizationSector || ''}`,
    '',
    `Gerado em ${new Date(data.createdAt).toLocaleDateString('pt-BR')}`
  );

  // IRP / IPP / IVO summary boxes
  pdf.ensureSpace(30);
  const boxW = CW / 3 - 4;
  const boxes = [
    { label: 'Indice de Risco (IRP)', value: `${data.irp}`, sub: data.irpClassification, color: getRiskColor(data.irp) },
    { label: 'Indice de Protecao (IPP)', value: `${data.ipp}`, sub: '100 - IRP', color: '#2ecc71' },
    { label: 'Vulnerabilidade (IVO)', value: `${data.ivo}/8`, sub: 'Dimensoes > 60 pts', color: data.ivo >= 3 ? '#e74c3c' : '#f39c12' },
  ];

  boxes.forEach((box, i) => {
    const bx = M.left + i * (boxW + 4);
    const [r, g, b] = hexToRgb(box.color);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.5);
    doc.roundedRect(bx, pdf.y, boxW, 24, 2, 2, 'S');

    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(box.label, bx + boxW / 2, pdf.y + 6, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(r, g, b);
    doc.setFont('helvetica', 'bold');
    doc.text(box.value, bx + boxW / 2, pdf.y + 16, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.setFont('helvetica', 'normal');
    doc.text(box.sub, bx + boxW / 2, pdf.y + 21, { align: 'center' });
  });

  pdf.y += 30;

  // Dimension table
  if (data.dimensionScores && Array.isArray(data.dimensionScores) && data.dimensionScores.length > 0) {
    pdf.ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...C.h1);
    doc.text('Resultados por Dimensao', M.left, pdf.y);
    pdf.y += 6;

    const dimBody = data.dimensionScores.map((d: any) => [
      d.name || d.dimensionId || '',
      Math.round(d.riskScore || 0).toString(),
      d.classification?.label || '',
      d.classification?.description || '',
    ]);

    autoTable(doc, {
      startY: pdf.y,
      head: [['Dimensao', 'Score', 'Classificacao', 'Observacao']],
      body: dimBody,
      margin: { left: M.left, right: M.right },
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [15, 52, 96], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 28 },
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const dim = data.dimensionScores[hookData.row.index];
          if (dim?.classification?.color) {
            const [r, g, b] = hexToRgb(dim.classification.color);
            hookData.cell.styles.textColor = [r, g, b];
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    pdf.y = (doc as any).lastAutoTable?.finalY + 8 || pdf.y + 40;
  }

  // Classification text
  pdf.ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.h1);
  doc.text('Classificacao NR1', M.left, pdf.y);
  pdf.y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...C.text);
  const classText = `Com base na avaliacao realizada, a organizacao ${data.organizationName} apresenta nivel de risco psicossocial classificado como ${data.irpClassification} (IRP: ${data.irp}/100).`;
  const classLines = doc.splitTextToSize(classText, CW);
  for (const line of classLines) {
    pdf.ensureSpace(5);
    doc.text(line, M.left, pdf.y);
    pdf.y += 4.2;
  }

  pdf.save(`Diagnostico_${data.organizationName.replace(/\s+/g, '_')}.pdf`);
}

// ─── Public API: MAPSO NR1 Full Report PDF ───────────────────────────────────
export async function downloadMapsoNR1Pdf(data: MapsoPdfData, branding?: BrandingInfo): Promise<void> {
  const pdf = new PdfDoc();
  const { doc } = pdf;

  pdf.addBranding(branding);
  pdf.addHeader(
    'RELAT\u00D3RIO FINAL \u2014 AVALIA\u00C7\u00C3O DE RISCOS PSICOSSOCIAIS',
    'Em conformidade com a NR-1 e NR-17',
    '',
    branding?.companyName || data.organizationName
  );

  // Organization info table
  const infoBody = [
    ['Empresa', data.organizationName],
    ['Setor', data.organizationSector || 'N/I'],
    ...(data.organizationDepartment ? [['Departamento', data.organizationDepartment]] : []),
    ['N. de Colaboradores', data.employeeCount?.toString() || 'N/I'],
    ['Data', new Date(data.createdAt).toLocaleDateString('pt-BR')],
    ['Responsavel Tecnico', 'Everton Nunes de Oliveira'],
    ['Registro Profissional', 'Psicanalista Clinico (Certificado 127400 PS) / Analista Comportamental e Coach (IBC / ISO 9001)'],
  ];

  autoTable(doc, {
    startY: pdf.y,
    body: infoBody,
    margin: { left: M.left, right: M.right },
    styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    theme: 'grid',
  });
  pdf.y = (doc as any).lastAutoTable?.finalY + 8 || pdf.y + 40;

  // Sections
  const addSection = (title: string, paragraphs: string[]) => {
    pdf.ensureSpace(14);
    pdf.y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...C.h1);
    doc.text(sanitizeText(title), M.left, pdf.y);
    pdf.y += 2;
    doc.setDrawColor(...C.border);
    doc.line(M.left, pdf.y + 2, A4.width - M.right, pdf.y + 2);
    pdf.y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...C.text);
    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(sanitizeText(p), CW);
      for (const line of lines) {
        pdf.ensureSpace(5);
        doc.text(line, M.left, pdf.y);
        pdf.y += 4.2;
      }
      pdf.y += 1.5;
    }
  };

  addSection('1. Introducao e Objetivos', [
    `O presente relatorio tem como objetivo identificar, avaliar e mitigar os fatores de risco psicossociais que podem afetar a saude mental e fisica dos colaboradores da empresa ${data.organizationName}, em conformidade com o PGR (Programa de Gerenciamento de Riscos) e as exigencias da NR-1 atualizada (Portaria MTE n. 1.419/2024).`,
    'A avaliacao foi realizada garantindo o anonimato de todos os participantes, utilizando o instrumento MAPSO - Modelo de Avaliacao e Gestao de Riscos Psicossociais Organizacionais, desenvolvido pelo Instituto Plenitude SOZO.',
  ]);

  addSection('2. Metodologia', [
    'Instrumento: Questionario MAPSO padronizado com 64 itens distribuidos em 8 dimensoes psicossociais, baseado nos modelos de Karasek (Demanda-Controle), Siegrist (Esforco-Recompensa) e Maslach (Burnout).',
    'Escala: Likert de 5 pontos (Nunca a Sempre), com itens diretos e invertidos.',
    'Amparo Legal: CBO 2515-50 e Parecer 159/2000 do MPF.',
  ]);

  addSection('3. Perfil da Amostra', [
    `Total de respondentes: ${data.employeeCount || 1} colaborador(es).`,
    `Setor de atuacao: ${data.organizationSector || 'N/I'}.`,
    ...(data.organizationDepartment ? [`Departamento avaliado: ${data.organizationDepartment}.`] : []),
  ]);

  // Results table
  addSection('4. Resultados da Avaliacao', []);
  if (data.dimensionScores && Array.isArray(data.dimensionScores) && data.dimensionScores.length > 0) {
    const dimBody = data.dimensionScores.map((d: any) => [
      d.name || '',
      Math.round(d.riskScore || 0).toString(),
      d.classification?.label || '',
      `${((d.weight || 0) * 100).toFixed(0)}%`,
    ]);

    autoTable(doc, {
      startY: pdf.y,
      head: [['Dimensao', 'Score', 'Classificacao', 'Peso']],
      body: dimBody,
      margin: { left: M.left, right: M.right },
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [15, 52, 96], textColor: [255, 255, 255] },
      columnStyles: {
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 16 },
      },
    });
    pdf.y = (doc as any).lastAutoTable?.finalY + 6 || pdf.y + 40;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...C.text);
  const summaryText = `Indice de Risco Psicossocial (IRP): ${data.irp} - ${data.irpClassification} | Indice de Protecao (IPP): ${data.ipp} | Vulnerabilidade (IVO): ${data.ivo}/8`;
  const sumLines = doc.splitTextToSize(summaryText, CW);
  for (const l of sumLines) { pdf.ensureSpace(5); doc.text(l, M.left, pdf.y); pdf.y += 4.2; }
  pdf.y += 4;

  // Action plan
  if (data.actionPlan && Array.isArray(data.actionPlan) && data.actionPlan.length > 0) {
    addSection('5. Plano de Acao', ['Com base nos riscos identificados, recomenda-se as seguintes acoes:']);

    const planBody = data.actionPlan.map((a: any, i: number) => [
      (i + 1).toString(),
      a.riskFactor || '',
      a.recommendedAction || '',
      a.responsible || '',
      a.deadline || '',
      a.priority || '',
    ]);

    autoTable(doc, {
      startY: pdf.y,
      head: [['#', 'Fator de Risco', 'Acao Recomendada', 'Responsavel', 'Prazo', 'Prioridade']],
      body: planBody,
      margin: { left: M.left, right: M.right },
      styles: { fontSize: 7.5, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [15, 52, 96], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 20 },
      },
    });
    pdf.y = (doc as any).lastAutoTable?.finalY + 6 || pdf.y + 40;
  }

  // Conclusion
  const conclusionText = data.irp > 60
    ? `Os resultados exigem intervencao imediata para evitar adoecimentos ocupacionais (Burnout, ansiedade, depressao). A implementacao das acoes propostas e fundamental para a conformidade legal e protecao da saude do trabalhador.`
    : data.irp > 40
    ? `Recomenda-se atencao preventiva e implementacao gradual das acoes propostas para manter o ambiente de trabalho saudavel e em conformidade com a NR1.`
    : `A organizacao demonstra boas praticas de gestao psicossocial. Recomenda-se manter o monitoramento periodico e as acoes de promocao de bem-estar.`;

  addSection('6. Conclusao', [
    `A avaliacao de riscos psicossociais realizada na empresa ${data.organizationName} evidenciou um nivel geral de risco classificado como ${data.irpClassification} (IRP: ${data.irp}/100).`,
    conclusionText,
  ]);

  // Signature
  pdf.ensureSpace(30);
  pdf.y += 10;
  doc.setDrawColor(50, 50, 50);
  doc.line(A4.width / 2 - 35, pdf.y, A4.width / 2 + 35, pdf.y);
  pdf.y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.text);
  doc.text('Everton Nunes de Oliveira', A4.width / 2, pdf.y, { align: 'center' });
  pdf.y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text('Psicanalista Clinico (Certificado 127400 PS)', A4.width / 2, pdf.y, { align: 'center' });
  pdf.y += 3;
  doc.text('Analista Comportamental e Coach (IBC / ISO 9001)', A4.width / 2, pdf.y, { align: 'center' });

  pdf.save(`Relatorio_NR1_${data.organizationName.replace(/\s+/g, '_')}.pdf`);
}
