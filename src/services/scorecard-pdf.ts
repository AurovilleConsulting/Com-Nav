import { jsPDF } from "jspdf";

import type {
  ScorecardOverallMetric,
  ScorecardPdfContent,
  ScorecardProfileField,
  ScorecardSection,
} from "@/lib/scorecard-email";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const LEFT_MARGIN = 18;
const RIGHT_MARGIN = 18;
const TOP_MARGIN = 20;
const BOTTOM_MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
const LINE_HEIGHT = 6;

function buildScorecardPdf(content: ScorecardPdfContent): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let cursorY = TOP_MARGIN;

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight <= PAGE_HEIGHT - BOTTOM_MARGIN) return;
    doc.addPage();
    cursorY = TOP_MARGIN;
  };

  const writeWrappedText = (
    text: string,
    options?: {
      size?: number;
      color?: [number, number, number];
      indent?: number;
      lineHeight?: number;
      bold?: boolean;
    },
  ) => {
    const fontSize = options?.size ?? 11;
    const indent = options?.indent ?? 0;
    const lineHeight = options?.lineHeight ?? LINE_HEIGHT;
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH - indent);

    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    if (options?.color) {
      doc.setTextColor(...options.color);
    } else {
      doc.setTextColor(33, 37, 41);
    }

    ensureSpace(lines.length * lineHeight);
    doc.text(lines, LEFT_MARGIN + indent, cursorY);
    cursorY += lines.length * lineHeight;
  };

  const writeSectionHeading = (heading: string) => {
    ensureSpace(10);
    doc.setDrawColor(15, 118, 110);
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(LEFT_MARGIN, cursorY - 4.5, CONTENT_WIDTH, 8, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 118, 110);
    doc.text(heading, LEFT_MARGIN + 3, cursorY + 1);
    cursorY += 10;
  };

  const writeLabelValueList = (items: ScorecardProfileField[] | ScorecardOverallMetric[]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);

    const widestLabel = items.reduce((maxWidth, item) => {
      const labelWidth = doc.getTextWidth(`${item.label}:`);
      return labelWidth > maxWidth ? labelWidth : maxWidth;
    }, 0);

    const labelColumnWidth = Math.min(52, Math.max(36, widestLabel + 4));
    const valueStartX = LEFT_MARGIN + labelColumnWidth;
    const valueWidth = CONTENT_WIDTH - labelColumnWidth;

    for (const item of items) {
      doc.setFont("helvetica", "normal");
      const valueLines = doc.splitTextToSize(item.value, valueWidth);
      const rowHeight = Math.max(5.5, valueLines.length * 5.5);

      ensureSpace(rowHeight + 1.5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${item.label}:`, LEFT_MARGIN, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(valueLines, valueStartX, cursorY);

      cursorY += rowHeight;
    }
  };

  const writeSectionsTable = (sections: ScorecardSection[]) => {
    const headers = ["Section", "Area", "Score", "Max", "Readiness %"] as const;
    const colWidths = [18, 86, 18, 16, 24] as const;

    ensureSpace(12);
    doc.setFillColor(241, 245, 249);
    doc.rect(LEFT_MARGIN, cursorY - 4, CONTENT_WIDTH, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    let x = LEFT_MARGIN + 2;
    headers.forEach((header, index) => {
      doc.text(header, x, cursorY + 1);
      x += colWidths[index];
    });
    cursorY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);

    for (const section of sections) {
      const titleLines = doc.splitTextToSize(section.title, colWidths[1] - 2);
      const rowHeight = Math.max(7, titleLines.length * 4.5 + 2);
      ensureSpace(rowHeight + 2);

      doc.setDrawColor(226, 232, 240);
      doc.line(LEFT_MARGIN, cursorY - 2, LEFT_MARGIN + CONTENT_WIDTH, cursorY - 2);

      x = LEFT_MARGIN + 2;
      doc.text(section.id, x, cursorY + 2);
      x += colWidths[0];
      doc.text(titleLines, x, cursorY + 2);
      x += colWidths[1];
      doc.text(String(section.score), x, cursorY + 2, { align: "right" });
      x += colWidths[2];
      doc.text(String(section.max), x, cursorY + 2, { align: "right" });
      x += colWidths[3];
      doc.text(`${section.pct.toFixed(1)}%`, x + 8, cursorY + 2, { align: "right" });
      cursorY += rowHeight;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(15, 118, 110);
  doc.text(content.scorecardTitle, LEFT_MARGIN, cursorY);
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  writeWrappedText(content.scorecardSubtitle, {
    size: 11,
    color: [71, 85, 105],
    lineHeight: 5.5,
  });
  cursorY += 2;
  writeWrappedText(
    `Generated on ${new Date(content.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`,
    {
      size: 9.5,
      color: [100, 116, 139],
      lineHeight: 5,
    },
  );
  cursorY += 4;

  writeSectionHeading("Company Profile");
  writeLabelValueList(content.profileFields);
  cursorY += 3;

  writeSectionHeading("Overall Results");
  writeLabelValueList(content.overallMetrics);
  cursorY += 3;

  writeSectionHeading("Section Breakdown");
  writeSectionsTable(content.sections);
  cursorY += 6;

  if (content.recommendation) {
    writeSectionHeading("Recommendation");
    writeWrappedText(content.recommendation, { size: 10.5, lineHeight: 5.5 });
    cursorY += 3;
  }

  if (content.conclusion) {
    writeSectionHeading("Conclusion");
    writeWrappedText(content.conclusion, { size: 10.5, lineHeight: 5.5 });
  }

  return doc;
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === "function") {
    return btoa(binary);
  }
  throw new Error("Base64 conversion is not available in this runtime");
}

export function generateScorecardPdfBase64(content: ScorecardPdfContent): string {
  const pdfDoc = buildScorecardPdf(content);
  const arrayBuffer = pdfDoc.output("arraybuffer");

  if (typeof Buffer !== "undefined") {
    return Buffer.from(arrayBuffer).toString("base64");
  }

  return arrayBufferToBase64(arrayBuffer);
}

export function downloadScorecardPdf(content: ScorecardPdfContent, filename: string): void {
  const pdfDoc = buildScorecardPdf(content);
  pdfDoc.save(filename);
}
