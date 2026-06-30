import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createReadStream, existsSync } from "fs";
import { join, extname, basename } from "path";
import { Readable } from "stream";
import { db } from "@/lib/db";

const UPLOAD_DIR =
  process.env.KB_UPLOAD_DIR ?? join(process.cwd(), "kb-files");

const MIME: Record<string, string> = {
  pdf:  "application/pdf",
  png:  "image/png",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  gif:  "image/gif",
  webp: "image/webp",
  svg:  "image/svg+xml",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc:  "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls:  "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt:  "application/vnd.ms-powerpoint",
  csv:  "text/csv",
  txt:  "text/plain",
};

const INLINE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;

  // Sanitise — prevent directory traversal
  const safe = basename(filename);
  if (safe !== filename || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // Confirm the requesting org actually owns a document with this URL
  const apiUrl = `/api/kb/files/${safe}`;
  const doc = await db.kbDocument.findFirst({
    where: { url: apiUrl, orgId },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = join(UPLOAD_DIR, safe);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const ext = extname(safe).slice(1).toLowerCase();
  const contentType = doc.fileType ?? MIME[ext] ?? "application/octet-stream";
  const disposition = INLINE_TYPES.has(contentType)
    ? "inline"
    : `attachment; filename="${safe}"`;

  // Stream file to response
  const nodeStream = createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
