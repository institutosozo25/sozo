/**
 * Shared PDF generation utility.
 * Fixes blank-PDF bug: html2canvas cannot capture off-screen elements.
 * Solution: render in a visible but visually hidden container with explicit dimensions.
 */
export async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
  const { default: html2pdf } = await import("html2pdf.js");

  // Create a container that is visible to html2canvas but not to the user
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: 794px;
    z-index: 9999;
    overflow: visible;
    background: white;
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    width: 794px;
    min-height: 1123px;
    padding: 20px;
    background: white;
    color: #1a1a2e;
    font-family: 'Segoe UI', Arial, sans-serif;
    line-height: 1.7;
    font-size: 14px;
  `;
  container.innerHTML = html;

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  // Give the browser time to layout and render all elements
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 794,
          windowWidth: 794,
          backgroundColor: "#ffffff",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(wrapper);
  }
}

/**
 * Converts markdown/mixed content from AI reports into clean HTML for display and PDF.
 * Handles both pure markdown and mixed markdown+HTML from Gemini responses.
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

  // If content already has significant HTML structure, just clean and return
  const htmlTagCount = (clean.match(/<(h[1-6]|p|ul|ol|li|div|table|tr|td|th|strong|em|br)\b/gi) || []).length;
  if (htmlTagCount > 5) {
    return clean;
  }

  // Convert markdown to HTML
  let html = clean;

  // Headers (process in order: h3, h2, h1)
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;margin:16px 0 8px;color:#1a1a2e;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;margin:20px 0 10px;color:#1a1a2e;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:24px 0 12px;color:#0f3460;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Numbered lists
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$2</li>');

  // Bullet lists
  html = html.replace(/^[•\-\*]\s+(.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/gs, (match) => {
    return `<ul style="margin:8px 0;padding-left:20px;list-style:disc;">${match}</ul>`;
  });

  // Convert remaining plain text blocks to paragraphs
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
