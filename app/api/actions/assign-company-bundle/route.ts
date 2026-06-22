import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { canAccessModule } from "@/lib/module-access";

const Schema = z.object({
  companyId: z.string(),
  bundleId: z.string(),
  assign: z.boolean(), // true = add, false = remove
});

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await canAccessModule(orgId, userId, "CRM"))) {
      return NextResponse.json({ error: "No CRM access." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

    const { companyId, bundleId, assign } = parsed.data;

    // Verify ownership
    const [company, bundle] = await Promise.all([
      db.company.findUnique({ where: { id: companyId, orgId }, select: { id: true } }),
      db.productBundle.findUnique({ where: { id: bundleId, orgId }, select: { id: true } }),
    ]);

    if (!company || !bundle) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (assign) {
      await db.companyBundle.upsert({
        where: { companyId_bundleId: { companyId, bundleId } },
        create: { companyId, bundleId },
        update: {},
      });
    } else {
      await db.companyBundle.deleteMany({ where: { companyId, bundleId } });
    }

    revalidatePath(`/organization/${orgId}/crm/companies/${companyId}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
