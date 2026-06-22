import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { canAccessModule } from "@/lib/module-access";

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await canAccessModule(orgId, userId, "CRM"))) {
      return NextResponse.json({ error: "No CRM access." }, { status: 403 });
    }

    const products = await db.product.findMany({
      where: { orgId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
