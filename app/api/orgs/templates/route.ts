import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

  const templates = await db.cardTemplate.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function DELETE(req: Request) {
  const { orgId } = await auth();
  if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await req.json();
  await db.cardTemplate.deleteMany({ where: { id, orgId } });
  return NextResponse.json({ ok: true });
}
