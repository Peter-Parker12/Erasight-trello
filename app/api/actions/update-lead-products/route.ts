import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { canAccessModule } from "@/lib/module-access";

const Schema = z.object({
  leadId: z.string(),
  productIds: z.array(z.string()),
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

    const { leadId, productIds } = parsed.data;

    const lead = await db.lead.findUnique({ where: { id: leadId, orgId }, select: { id: true } });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

    await db.$transaction([
      db.leadProduct.deleteMany({ where: { leadId } }),
      ...productIds.map((productId) =>
        db.leadProduct.create({ data: { leadId, productId } })
      ),
    ]);

    revalidatePath(`/organization/${orgId}/crm/leads`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
