import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GOOGLE_DOC_RE = /docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([^/?#]+)/;
const GOOGLE_DRIVE_RE = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*id=)([^/?&#]+)/;

const PRIVATE_HINT =
  "This file is not publicly accessible. In Google, go to Share → 'Anyone with the link' → Viewer, then try again.";

// Convert Google Docs/Slides/Sheets edit URLs to their /pub endpoint.
// /pub returns 200 for public docs and redirects to accounts.google.com for private ones.
function toGoogleDocPublishUrl(url: string): string | null {
  const m = url.match(GOOGLE_DOC_RE);
  if (!m) return null;
  const [, type, id] = m;
  const path =
    type === "presentation" ? "presentation" : type === "spreadsheets" ? "spreadsheets" : "document";
  return `https://docs.google.com/${path}/d/${id}/pub`;
}

// For Google Drive file links, fetch the thumbnail endpoint.
// It's a tiny image request: 200 = public, redirects to accounts.google.com = private.
function toGoogleDriveThumbnailUrl(url: string): string | null {
  const m = url.match(GOOGLE_DRIVE_RE);
  if (!m) return null;
  return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1`;
}

async function checkUrl(url: string): Promise<{ accessible: boolean; hint?: string }> {
  const checkTarget =
    toGoogleDocPublishUrl(url) ?? toGoogleDriveThumbnailUrl(url) ?? url;

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

    // For Drive thumbnail: a private file sometimes returns 200 with a "login" page.
    // Detect it by checking Content-Type — a real thumbnail is image/*, not text/html.
    if (toGoogleDriveThumbnailUrl(url)) {
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
