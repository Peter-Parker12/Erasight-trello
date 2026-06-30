import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createWriteStream, existsSync } from "fs";
import { mkdir } from "fs/promises";
import { join, extname } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { randomUUID } from "crypto";

// Allow up to 5 minutes for large uploads — Next.js default is 10s on Vercel, unlimited on self-hosted
export const maxDuration = 300;

const UPLOAD_DIR =
  process.env.KB_UPLOAD_DIR ?? join(process.cwd(), "kb-files");

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const filename = url.searchParams.get("filename") ?? "";
  if (!filename) {
    return NextResponse.json({ error: "filename query param required" }, { status: 400 });
  }

  if (!req.body) {
    return NextResponse.json({ error: "No file body" }, { status: 400 });
  }

  // Reject early if Content-Length header says it's too big
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds the 50 MB limit." }, { status: 413 });
  }

  const ext = extname(filename);
  const uniqueName = `${randomUUID()}${ext}`;
  const destPath = join(UPLOAD_DIR, uniqueName);

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  // Stream body directly to disk — never holds the full file in RAM
  let bytesWritten = 0;
  const writeStream = createWriteStream(destPath);

  try {
    const nodeReadable = Readable.fromWeb(
      req.body as import("stream/web").ReadableStream<Uint8Array>
    );

    // Enforce size limit while streaming
    const sizeGuard = async function* (source: AsyncIterable<Buffer>) {
      for await (const chunk of source) {
        bytesWritten += chunk.length;
        if (bytesWritten > MAX_SIZE_BYTES) {
          throw new Error("FILE_TOO_LARGE");
        }
        yield chunk;
      }
    };

    await pipeline(sizeGuard(nodeReadable as AsyncIterable<Buffer>), writeStream);
  } catch (err) {
    // Clean up the partial file
    writeStream.destroy();
    try {
      const { unlink } = await import("fs/promises");
      await unlink(destPath).catch(() => null);
    } catch {
      // ignore
    }

    const message = err instanceof Error ? err.message : "";
    if (message === "FILE_TOO_LARGE") {
      return NextResponse.json({ error: "File exceeds the 50 MB limit." }, { status: 413 });
    }
    console.error("[KB_UPLOAD]", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ url: `/api/kb/files/${uniqueName}` });
}
