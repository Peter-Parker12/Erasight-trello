import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canAccessModule } from "@/lib/module-access";

// Color palette cycled for new categories
const PALETTE = [
  "#7c3aed", "#2563eb", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#7c2d12", "#4f46e5",
  "#be185d", "#65a30d",
];

// GET  /api/crm/product-categories  – list all for org
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessModule(orgId, userId, "CRM")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const categories = await db.productCategory.findMany({
    where: { orgId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(categories);
}

// POST /api/crm/product-categories  – create
export async function POST(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessModule(orgId, userId, "CRM")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const existing = await db.productCategory.findMany({ where: { orgId }, orderBy: { order: "asc" } });
  const color = PALETTE[existing.length % PALETTE.length];

  try {
    const cat = await db.productCategory.create({
      data: { orgId, name: name.trim(), color, order: existing.length },
    });
    return NextResponse.json(cat);
  } catch {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }
}

// DELETE /api/crm/product-categories?id=...
export async function DELETE(req: NextRequest) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessModule(orgId, userId, "CRM")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.productCategory.deleteMany({ where: { id, orgId } });
  return NextResponse.json({ ok: true });
}
