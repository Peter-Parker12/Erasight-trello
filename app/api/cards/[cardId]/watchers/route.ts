import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { cardId } = await params;

  const watchers = await db.cardWatcher.findMany({ where: { cardId } });
  const watching = watchers.some((w) => w.userId === userId);

  return NextResponse.json({ watchers, watching, count: watchers.length });
}
