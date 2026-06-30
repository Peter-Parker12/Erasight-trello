import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GOOGLE_DOC_RE = /docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([^/]+)/;

function toPublishUrl(url: string): string | null {
  const m = url.match(GOOGLE_DOC_RE);
  if (!m) return null;
  const [, type, id] = m;
  const path =
    type === "presentation"
      ? "presentation"
      : type === "spreadsheets"
      ? "spreadsheets"
      : "document";
  return `https://docs.google.com/${path}/d/${id}/pub`;
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

  const pubUrl = toPublishUrl(url) ?? url;

  try {
    const res = await fetch(pubUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const isPrivate =
      res.url.includes("accounts.google.com") ||
      res.url.includes("login.microsoftonline.com");

    if (isPrivate || res.status === 401 || res.status === 403) {
      return NextResponse.json({
        accessible: false,
        hint: "This file is not publicly accessible. Open it in Google → Share → Change to "Anyone with the link" → Viewer, then try again.",
      });
    }

    return NextResponse.json({ accessible: res.ok });
  } catch {
    return NextResponse.json({
      accessible: false,
      hint: "Could not reach the URL. Check the link and try again.",
    });
  }
}
