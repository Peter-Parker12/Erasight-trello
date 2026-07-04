import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canPerform } from "@/lib/rbac";
import { ACTIONS } from "@/lib/rbac-actions";

export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { orgId: sessionOrgId, userId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canPerform(orgId, userId, ACTIONS.REVIEW_SKILLS_MANAGE))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const skills = await db.reviewSkill.findMany({
    where: { orgId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data: skills });
}

export async function POST(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { orgId: sessionOrgId, userId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canPerform(orgId, userId, ACTIONS.REVIEW_SKILLS_MANAGE))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, prompt, enabled, order } = await req.json();
  if (!name || !description || !prompt) {
    return NextResponse.json({ error: "name, description, and prompt are required" }, { status: 400 });
  }

  const maxOrder = await db.reviewSkill.aggregate({ where: { orgId }, _max: { order: true } });
  const nextOrder = order ?? (maxOrder._max.order ?? -1) + 1;

  const skill = await db.reviewSkill.create({
    data: { orgId, name, description, prompt, enabled: enabled ?? true, order: nextOrder },
  });

  return NextResponse.json({ data: skill });
}
