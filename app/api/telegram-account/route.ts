import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return new NextResponse("Unauthorized", { status: 401 });

    const account = await db.userTelegramAccount.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });

    return NextResponse.json({ telegramUsername: account?.telegramUsername ?? null });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
