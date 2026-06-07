import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET /api/notifications — fetch unread notifications for current user
export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId, orgId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(notifications);
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

  await db.notification.updateMany({
    where: { userId, orgId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
