import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

async function guard(orgId: string) {
  const { orgId: sessionOrgId, userId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId || !userId) return "unauthorized";
  if (!(await canPerform(orgId, userId, ACTIONS.REVIEW_PARTNERS_MANAGE))) return "forbidden";
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; partnerId: string }> }
) {
  const { orgId, partnerId } = await params;
  const { orgId: sessionOrgId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partner = await db.reviewPartner.findFirst({ where: { id: partnerId, orgId } });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: partner });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orgId: string; partnerId: string }> }
) {
  const { orgId, partnerId } = await params;
  const err = await guard(orgId);
  if (err === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, context } = await req.json();

  const result = await db.reviewPartner.updateMany({
    where: { id: partnerId, orgId },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(context !== undefined && { context }),
    },
  });

  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.reviewPartner.findUnique({ where: { id: partnerId } });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; partnerId: string }> }
) {
  const { orgId, partnerId } = await params;
  const err = await guard(orgId);
  if (err === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.reviewPartner.deleteMany({ where: { id: partnerId, orgId } });
  return NextResponse.json({ data: null });
}
