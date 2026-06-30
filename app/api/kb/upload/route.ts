import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR =
  process.env.KB_UPLOAD_DIR ?? join(process.cwd(), "public", "kb-uploads");

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

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

  const buffer = Buffer.from(await req.arrayBuffer());

  if (buffer.length > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 50 MB limit." }, { status: 413 });
  }

  const ext = extname(filename);
  const uniqueName = `${randomUUID()}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, uniqueName), buffer);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({ url: `${base}/kb-uploads/${uniqueName}` });
}
