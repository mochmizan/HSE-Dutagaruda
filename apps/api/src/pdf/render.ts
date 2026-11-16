export interface RenderOptions {
  landscape: boolean;
}

function pdfEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

function extractLinesFromHtml(html: string): string[] {
  const withoutStyle = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
  const withBreaks = withoutStyle
    .replace(/<\/(tr|p|div|h1|h2|h3|li|dt|dd|header|section|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(td|th)>/gi, " | ");
  const stripped = withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#10003;|&radic;|&#10004;/g, "V")
    .replace(/&#10007;/g, "X")
    .replace(/&nbsp;/g, " ");
  return stripped
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

/**
 * Pure TypeScript PDF 1.4 generator (Gotenberg removed).
 * Primary printing is handled via procedural print preview pages in the web app;
 * this native generator fulfills `/api/export/:category/:refId` with zero external container dependencies.
 */
export async function renderPdf(html: string, opts: RenderOptions): Promise<Uint8Array> {
  const width = opts.landscape ? 842 : 595;
  const height = opts.landscape ? 595 : 842;
  const isTwoPageApar = html.includes("page-break") || html.includes("Kadaluwarsa APAR");
  const lines = extractLinesFromHtml(html);
  const perPage = opts.landscape ? 36 : 48;
  const pageChunks: string[][] = [];

  if (isTwoPageApar && lines.length > 0) {
    const mid = Math.max(1, Math.ceil(lines.length / 2));
    pageChunks.push(lines.slice(0, mid), lines.slice(mid));
  } else {
    for (let i = 0; i < Math.max(1, lines.length); i += perPage) {
      pageChunks.push(lines.slice(i, i + perPage));
    }
  }

  const objects: string[] = [];
  const pageCount = pageChunks.length;
  const firstPageObjId = 4;
  const kids = Array.from({ length: pageCount }, (_, idx) => `${firstPageObjId + idx * 2} 0 R`).join(" ");

  // 1: Catalog, 2: Pages, 3: Font
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj`);
  objects.push("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

  pageChunks.forEach((chunk, idx) => {
    const pageObjId = firstPageObjId + idx * 2;
    const contentObjId = pageObjId + 1;
    const streamLines = ["BT", "/F1 9 Tf", `36 ${height - 42} Td`, "12 TL"];
    for (const line of chunk) {
      streamLines.push(`(${pdfEscape(line.slice(0, 115))}) Tj T*`);
    }
    streamLines.push("ET");
    const streamData = streamLines.join("\n");

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`,
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj`,
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return new TextEncoder().encode(pdf);
}
