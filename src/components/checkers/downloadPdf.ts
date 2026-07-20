import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

function buildPdfFromElement(canvas: HTMLCanvasElement): jsPDF {
  const imageData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const imageHeight = (canvas.height * printableWidth) / canvas.width;

  let renderedHeight = 0;
  let pageIndex = 0;

  while (renderedHeight < imageHeight) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const y = margin - renderedHeight;
    pdf.addImage(imageData, "PNG", margin, y, printableWidth, imageHeight, undefined, "FAST");

    renderedHeight += printableHeight;
    pageIndex += 1;
  }

  return pdf;
}

async function renderElementToCanvas(target: HTMLElement): Promise<HTMLCanvasElement> {
  await new Promise((r) => setTimeout(r, 50));

  return html2canvas(target, {
    backgroundColor: "#ffffff",
    scale: Math.min(2, window.devicePixelRatio || 1.5),
    useCORS: true,
    ignoreElements: (element) => element.hasAttribute("data-html2canvas-ignore"),
  });
}

/**
 * Creates a downloadable PDF from the current scorecard UI section so exported
 * content matches on-screen design.
 */
export async function downloadElementAsPdf(
  el?: HTMLElement | null,
  filename = "scorecard.pdf",
) {
  if (typeof window === "undefined") return;

  const target = el ?? document.getElementById("pdf-export-area");
  if (!target) {
    window.print();
    return;
  }

  const canvas = await renderElementToCanvas(target);
  const pdf = buildPdfFromElement(canvas);
  pdf.save(filename);
}

export async function generateElementPdfBase64(el?: HTMLElement | null): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("PDF generation is only available in browser runtime");
  }

  const target = el ?? document.getElementById("pdf-export-area");
  if (!target) {
    throw new Error("PDF export element not found");
  }

  const canvas = await renderElementToCanvas(target);
  const pdf = buildPdfFromElement(canvas);
  return pdf.output("datauristring").split(",")[1] ?? "";
}
