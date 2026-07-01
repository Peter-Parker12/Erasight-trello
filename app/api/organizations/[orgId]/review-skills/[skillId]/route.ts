import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";

async function guard(orgId: string) {
  const { orgId: sessionOrgId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId) return "unauthorized";
  if (!(await isOrgAdmin(orgId))) return "forbidden";
  return null;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orgId: string; skillId: string }> }
) {
  const { orgId, skillId } = await params;
  const err = await guard(orgId);
  if (err === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, prompt, enabled, order } = await req.json();

  const skill = await db.reviewSkill.updateMany({
    where: { id: skillId, orgId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(prompt !== undefined && { prompt }),
      ...(enabled !== undefined && { enabled }),
      ...(order !== undefined && { order }),
    },
  });

  if (skill.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.reviewSkill.findUnique({ where: { id: skillId } });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; skillId: string }> }
) {
  const { orgId, skillId } = await params;
  const err = await guard(orgId);
  if (err === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (err === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.reviewSkill.deleteMany({ where: { id: skillId, orgId } });
  return NextResponse.json({ data: null });
}
