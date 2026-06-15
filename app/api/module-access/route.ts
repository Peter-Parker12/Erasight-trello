import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getAccessibleModules } from "@/lib/module-access";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return new NextResponse("Missing orgId", { status: 400 });

  const modules = await getAccessibleModules(orgId);
  return NextResponse.json(modules);
}
