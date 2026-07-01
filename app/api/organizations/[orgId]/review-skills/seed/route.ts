import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { DEFAULT_REVIEW_SKILLS } from "@/lib/default-review-skills";

export async function POST(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { orgId: sessionOrgId } = await auth();
  if (!sessionOrgId || sessionOrgId !== orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isOrgAdmin(orgId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db.reviewSkill.findMany({
    where: { orgId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((s) => s.name));

  const toCreate = DEFAULT_REVIEW_SKILLS.filter((s) => !existingNames.has(s.name));

  if (toCreate.length === 0) {
    return NextResponse.json({ data: [], message: "All default skills already exist" });
  }

  await db.reviewSkill.createMany({
    data: toCreate.map((s) => ({ ...s, orgId })),
  });

  const created = await db.reviewSkill.findMany({
    where: { orgId, name: { in: toCreate.map((s) => s.name) } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data: created, message: `Created ${created.length} skills` });
}
