import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { canAccessModule } from "@/lib/module-access";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await canAccessModule(orgId, userId, "CRM"))) {
      return NextResponse.json({ error: "No CRM access." }, { status: 403 });
    }

    const [company, definitionRows, allBundles] = await Promise.all([
      db.company.findUnique({
        where: { id: companyId, orgId },
        include: {
          contacts: { orderBy: { createdAt: "desc" } },
          leads: { include: { stage: true }, orderBy: { createdAt: "desc" } },
          bundles: {
            include: {
              bundle: { include: { items: { where: { active: true }, include: { product: true } } } },
            },
          },
        },
      }),
      getFieldDefinitions(orgId, "COMPANY"),
      db.productBundle.findMany({
        where: { orgId },
        include: { items: { where: { active: true }, include: { product: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    if (!company) return NextResponse.json({ error: "Not found." }, { status: 404 });

    return NextResponse.json({
      company,
      definitions: definitionRows.map(toFieldDefinitionDTO),
      allBundles,
    });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
