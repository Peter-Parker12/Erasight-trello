import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, extname } from "path";
import { randomUUID } from "crypto";

export const maxDuration = 300;

const UPLOAD_DIR =
  process.env.KB_UPLOAD_DIR ?? join(process.cwd(), "kb-files");

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filename = new URL(req.url).searchParams.get("filename") ?? "";
  if (!filename) {
    return NextResponse.json({ error: "filename query param required" }, { status: 400 });
  }

  if (!req.body) {
    return NextResponse.json({ error: "No file body" }, { status: 400 });
  }

  // Reject early if Content-Length says it's already too big
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 50 MB limit." }, { status: 413 });
  }

  let buffer: Buffer;
  try {
    const arrayBuffer = await req.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds the 50 MB limit." }, { status: 413 });
    }
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to read file body." }, { status: 500 });
  }

  const ext = extname(filename);
  const uniqueName = `${randomUUID()}${ext}`;

  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
    await writeFile(join(UPLOAD_DIR, uniqueName), buffer);
  } catch (err) {
    console.error("[KB_UPLOAD]", err);
    return NextResponse.json({ error: "Failed to save file." }, { status: 500 });
  }

  return NextResponse.json({ url: `/api/kb/files/${uniqueName}` });
}
