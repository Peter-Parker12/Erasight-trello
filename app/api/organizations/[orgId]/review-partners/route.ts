import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { orgId: sessionOrgId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partners = await db.reviewPartner.findMany({
    where: { orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, createdAt: true },
  });

  return NextResponse.json({ data: partners });
}

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { orgId: sessionOrgId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isOrgAdmin(orgId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, slug, context } = await req.json();
  if (!name || !slug || !context) {
    return NextResponse.json({ error: "name, slug, and context are required" }, { status: 400 });
  }

  const partner = await db.reviewPartner.create({
    data: { orgId, name, slug, context },
  });

  return NextResponse.json({ data: partner });
}
