import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GOOGLE_DOC_RE = /docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([^/?#]+)/;
const GOOGLE_DRIVE_FILE_RE = /drive\.google\.com\/file\/d\/([^/?#]+)/;
const GOOGLE_DRIVE_OPEN_RE = /drive\.google\.com\/open\?.*id=([^&]+)/;

const PRIVATE_HINT =
  "This file is not publicly accessible. In Google, go to Share → 'Anyone with the link' → Viewer, then try again.";

// Normalise a Google Docs/Slides/Sheets URL to the /view endpoint.
// /view works for "Anyone with the link" sharing (no login needed server-side).
// We deliberately avoid /pub — that requires "Publish to the web", a different setting.
function toGoogleDocViewUrl(url: string): string | null {
  const m = url.match(GOOGLE_DOC_RE);
  if (!m) return null;
  const [, type, id] = m;
  const path =
    type === "presentation" ? "presentation" : type === "spreadsheets" ? "spreadsheets" : "document";
  return `https://docs.google.com/${path}/d/${id}/view`;
}

// For Drive file links, use the thumbnail endpoint — lightweight image request.
// Public file → image/* response. Private → HTML or redirect to accounts.google.com.
function toGoogleDriveThumbnailUrl(url: string): string | null {
  const fileMatch = url.match(GOOGLE_DRIVE_FILE_RE) ?? url.match(GOOGLE_DRIVE_OPEN_RE);
  if (!fileMatch) return null;
  return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1`;
}

async function checkUrl(url: string): Promise<{ accessible: boolean; hint?: string }> {
  const isDriveFile = GOOGLE_DRIVE_FILE_RE.test(url) || GOOGLE_DRIVE_OPEN_RE.test(url);
  const checkTarget =
    toGoogleDriveThumbnailUrl(url) ?? toGoogleDocViewUrl(url) ?? url;

  try {
    const res = await fetch(checkTarget, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const isPrivate =
      res.url.includes("accounts.google.com") ||
      res.url.includes("login.microsoftonline.com");

    if (isPrivate || res.status === 401 || res.status === 403) {
      return { accessible: false, hint: PRIVATE_HINT };
    }

    // Drive thumbnail: private files return HTML ("You need access"), not an image.
    if (isDriveFile) {
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.startsWith("image/")) {
        return { accessible: false, hint: PRIVATE_HINT };
      }
    }

    return { accessible: res.ok };
  } catch {
    return { accessible: false, hint: "Could not reach the URL. Check the link and try again." };
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let url: string;
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.trim() : "";
  } catch {
    return NextResponse.json({ accessible: false, hint: "Invalid request." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ accessible: false, hint: "No URL provided." });
  }

  const result = await checkUrl(url);
  return NextResponse.json(result);
}
