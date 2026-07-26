import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { generateOkrTemplate } from "@/lib/okr-import/generate-template";

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isOrgAdmin(orgId))) {
    return NextResponse.json({ error: "Only admins can download the import template." }, { status: 403 });
  }

  const departments = await db.department.findMany({
    where: { orgId },
    select: { name: true },
    orderBy: { order: "asc" },
  });

  const buffer = generateOkrTemplate(departments);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="okr-kpi-template.xlsx"',
      "Content-Length": String(buffer.length),
    },
  });
}
