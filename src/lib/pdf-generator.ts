/**
 * Shared PDF generation utility.
 * Fixes blank-PDF bug: html2canvas cannot capture off-screen elements.
 * Solution: render in a visible but visually hidden container with explicit dimensions.
 * IMPORTANT: Avoid flexbox in HTML templates — use <table> layouts for html2canvas compatibility.
 */
import { supabase } from "@/integrations/supabase/client";

function createRenderContainer(html: string): { wrapper: HTMLDivElement; container: HTMLDivElement } {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: fixed; top: 0; left: -9999px; width: 794px;
    z-index: 9999; overflow: visible; background: white;
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    width: 794px; min-height: 1123px; padding: 20px; background: white;
    color: #1a1a2e; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.7; font-size: 14px;
  `;
  container.innerHTML = html;

  wrapper.appendChild(container);
  return { wrapper, container };
}

const pdfOptions = {
  margin: [10, 10, 10, 10],
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
    width: 794,
    windowWidth: 794,
    backgroundColor: "#ffffff",
  },
  jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
  pagebreak: { mode: ["avoid-all", "css", "legacy"] },
};

export async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
  const { default: html2pdf } = await import("html2pdf.js");
  const { wrapper, container } = createRenderContainer(html);

  document.body.appendChild(wrapper);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    await html2pdf()
      .set({ ...pdfOptions, filename })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}

/**
 * Generate PDF blob from HTML (for storage upload).
 */
export async function generatePdfBlob(html: string): Promise<Blob> {
  const { default: html2pdf } = await import("html2pdf.js");
  const { wrapper, container } = createRenderContainer(html);

  document.body.appendChild(wrapper);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const blob: Blob = await html2pdf()
      .set(pdfOptions)
      .from(container)
      .outputPdf("blob");
    return blob;
  } finally {
    document.body.removeChild(wrapper);
  }
}

/**
 * Upload PDF to Supabase Storage organized by empresa_id/mapso/.
 * Returns the storage path on success, null on failure.
 */
export async function uploadPdfToStorage(
  html: string,
  empresaId: string,
  filename: string
): Promise<string | null> {
  try {
    const blob = await generatePdfBlob(html);
    const storagePath = `${empresaId}/mapso/${filename}`;

    const { error } = await supabase.storage
      .from("test-pdfs")
      .upload(storagePath, blob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }
    return storagePath;
  } catch (e) {
    console.error("PDF upload error:", e);
    return null;
  }
}

/**
 * Converts markdown/mixed content from AI reports into clean HTML for display and PDF.
 */
export function sanitizeAndFormatReport(content: string): string {
  if (!content) return "<p>Relatório não disponível.</p>";

  // Remove dangerous tags
  let clean = content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/<link[\s\S]*?>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");

  const htmlTagCount = (clean.match(/<(h[1-6]|p|ul|ol|li|div|table|tr|td|th|strong|em|br)\b/gi) || []).length;
  if (htmlTagCount > 5) return clean;

  let html = clean;

  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:16px 0 8px;color:#1a1a2e;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;margin:20px 0 10px;color:#1a1a2e;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:24px 0 12px;color:#0f3460;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">$1</h1>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$2</li>');
  html = html.replace(/^[•\-\*]\s+(.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>');

  html = html.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/gs, (match) => {
    return `<ul style="margin:8px 0;padding-left:20px;list-style:disc;">${match}</ul>`;
  });

  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;
  let paragraphContent = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inParagraph && paragraphContent) {
        result.push(`<p style="margin:8px 0;line-height:1.7;">${paragraphContent}</p>`);
        paragraphContent = '';
        inParagraph = false;
      }
      continue;
    }
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<li') || trimmed.startsWith('<div') || trimmed.startsWith('<table')) {
      if (inParagraph && paragraphContent) {
        result.push(`<p style="margin:8px 0;line-height:1.7;">${paragraphContent}</p>`);
        paragraphContent = '';
        inParagraph = false;
      }
      result.push(trimmed);
    } else if (trimmed.startsWith('</')) {
      result.push(trimmed);
    } else {
      inParagraph = true;
      paragraphContent += (paragraphContent ? ' ' : '') + trimmed;
    }
  }
  if (inParagraph && paragraphContent) {
    result.push(`<p style="margin:8px 0;line-height:1.7;">${paragraphContent}</p>`);
  }

  return result.join('\n');
}
