import * as cheerio from "cheerio";

function extractGoogleDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

function extractGoogleDriveId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const params = new URL(url).searchParams;
  return params.get("id");
}

async function extractFromGoogleDoc(url: string): Promise<string> {
  const docId = extractGoogleDocId(url);
  if (!docId) throw new Error("Could not parse Google Doc ID from URL");
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const res = await fetch(exportUrl);
  if (!res.ok) throw new Error(`Google Docs export failed: ${res.status} ${res.statusText}`);
  return res.text();
}

async function extractFromGoogleDrive(url: string): Promise<string> {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) throw new Error("Could not parse Google Drive file ID from URL");
  const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(exportUrl);
  if (!res.ok) throw new Error(`Google Drive download failed: ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    return extractFromPdfBuffer(await res.arrayBuffer());
  }
  return res.text();
}

async function extractFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
  // Dynamic import to avoid build issues with pdf-parse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: any = (await import("pdf-parse" as any))?.default ?? (await import("pdf-parse" as any));
  const data = await pdfParse(Buffer.from(buffer));
  return data.text;
}

async function extractFromPdfUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
  return extractFromPdfBuffer(await res.arrayBuffer());
}

async function extractFromHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

async function extractFromBase64(dataUrl: string): Promise<string> {
  const [header, base64Data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch?.[1] ?? "";
  const buffer = Buffer.from(base64Data, "base64");

  if (mime === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: any = (await import("pdf-parse" as any))?.default ?? (await import("pdf-parse" as any));
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mime.startsWith("text/")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Cannot extract text from base64 file of type: ${mime}`);
}

export async function extractFileContent(url: string): Promise<string> {
  if (url.startsWith("data:")) {
    return extractFromBase64(url);
  }

  if (url.includes("docs.google.com/document")) {
    return extractFromGoogleDoc(url);
  }

  if (url.includes("drive.google.com")) {
    return extractFromGoogleDrive(url);
  }

  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) {
    return extractFromPdfUrl(url);
  }

  if (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".csv")
  ) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
    return res.text();
  }

  // Fallback: fetch and strip HTML
  return extractFromHtml(url);
}
