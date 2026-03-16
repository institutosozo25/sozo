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
    left: 0;
    width: 210mm;
    z-index: -1;
    opacity: 0;
    pointer-events: none;
    overflow: visible;
    background: white;
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 0;
    background: white;
    color: #1a1a2e;
    font-family: 'Segoe UI', Arial, sans-serif;
    line-height: 1.7;
  `;
  container.innerHTML = html;

  wrapper.appendChild(container);
  document.body.appendChild(wrapper);

  // Small delay to let browser layout the elements
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          width: container.scrollWidth,
          height: container.scrollHeight,
          windowWidth: container.scrollWidth,
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
