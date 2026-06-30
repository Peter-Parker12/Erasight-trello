import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filename = new URL(req.url).searchParams.get("filename");
  if (!filename) {
    return NextResponse.json({ error: "filename query param required" }, { status: 400 });
  }

  if (!req.body) {
    return NextResponse.json({ error: "No file body" }, { status: 400 });
  }

  const blob = await put(filename, req.body, { access: "public" });
  return NextResponse.json({ url: blob.url });
}
