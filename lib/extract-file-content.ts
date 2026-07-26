import * as cheerio from "cheerio";

// Matches check-url.ts's approach: many hosts block/redirect requests that
// don't look like a browser, and requests here have no timeout by default.
const FETCH_HEADERS = { "User-Agent": "Mozilla/5.0" };
const FETCH_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string): Promise<Response> {
  return fetch(url, {
    headers: FETCH_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

// Design-tool editor URLs (Canva, Figma, etc.) are private, session-authenticated,
// JS-rendered pages — no server-side fetch can ever read them, regardless of
// headers. Fail fast with guidance instead of a confusing fetch error.
const PRIVATE_EDITOR_HOSTS: { re: RegExp; name: string }[] = [
  { re: /canva\.com\/design\/.+\/edit/i, name: "Canva" },
  { re: /figma\.com\/(file|design)\//i, name: "Figma" },
];

function checkForPrivateEditorUrl(url: string): void {
  const match = PRIVATE_EDITOR_HOSTS.find(({ re }) => re.test(url));
  if (match) {
    throw new Error(
      `This is a ${match.name} editor link, which is private and can't be read by the review service. ` +
        `Export/download the file (e.g. PDF or PPTX) and attach that instead, or share a public "view" link if ${match.name} offers one.`
    );
  }
}

const GOOGLE_DOC_RE = /docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([^/?#]+)/;

function toGoogleDocExportUrl(url: string): string | null {
  const m = url.match(GOOGLE_DOC_RE);
  if (!m) return null;
  const [, type, id] = m;
  if (type === "presentation") return `https://docs.google.com/presentation/d/${id}/export/txt`;
  if (type === "spreadsheets") return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  return `https://docs.google.com/document/d/${id}/export?format=txt`;
}

function extractGoogleDriveId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

async function extractFromGoogleDoc(url: string): Promise<string> {
  const exportUrl = toGoogleDocExportUrl(url);
  if (!exportUrl) throw new Error("Could not parse Google Docs/Slides/Sheets ID from URL");
  const res = await fetchWithTimeout(exportUrl);
  if (!res.ok) {
    throw new Error(
      `Google Docs export failed: ${res.status} ${res.statusText}. ` +
        `Make sure sharing is set to "Anyone with the link" → Viewer.`
    );
  }
  return res.text();
}

async function extractFromGoogleDrive(url: string): Promise<string> {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) throw new Error("Could not parse Google Drive file ID from URL");
  const exportUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetchWithTimeout(exportUrl);
  if (!res.ok) {
    throw new Error(
      `Google Drive download failed: ${res.status}. Make sure sharing is set to "Anyone with the link" → Viewer.`
    );
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    return extractFromPdfBuffer(await res.arrayBuffer());
  }
  if (contentType.includes("text/html")) {
    // Drive serves an HTML "can't scan for viruses" confirmation page instead of
    // the file itself for large/unscannable files — this is not the real content.
    throw new Error(
      "Google Drive returned a confirmation page instead of the file (this happens for large files it can't virus-scan). " +
        "Try a smaller file, or share it as a Google Doc/Slides/Sheets instead of a raw upload."
    );
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
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
  return extractFromPdfBuffer(await res.arrayBuffer());
}

async function extractFromHtml(url: string): Promise<string> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch URL: ${res.status} ${res.statusText}. ` +
        `The link may be private, require login, or be blocking automated requests.`
    );
  }
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
  checkForPrivateEditorUrl(url);

  if (url.startsWith("data:")) {
    return extractFromBase64(url);
  }

  if (GOOGLE_DOC_RE.test(url)) {
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
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    return res.text();
  }

  if (lower.endsWith(".ppt") || lower.endsWith(".pptx") || lower.endsWith(".doc") || lower.endsWith(".docx")) {
    throw new Error(
      "This file type (PowerPoint/Word) can't be read directly. Convert it to PDF and attach that instead, " +
        "or use a Google Docs/Slides link with link sharing turned on."
    );
  }

  // Fallback: fetch and strip HTML
  return extractFromHtml(url);
}
