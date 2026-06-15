import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { isModuleKey } from "@/lib/modules";

export async function GET(req: Request) {
  try {
    const { orgId } = await auth();
    if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

    if (!(await isOrgAdmin(orgId))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const module = new URL(req.url).searchParams.get("module");
    if (!module || !isModuleKey(module)) {
      return new NextResponse("Invalid module", { status: 400 });
    }

    const client = await clerkClient();
    const [moduleMembers, orgMemberList, displayNames] = await Promise.all([
      db.moduleAccess.findMany({ where: { orgId, module } }),
      client.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
      db.userDisplayName.findMany({ where: { orgId } }),
    ]);

    const memberIds = new Set(moduleMembers.map((m) => m.userId));
    const displayNameMap = new Map(displayNames.map((d) => [d.userId, d.displayName]));

    const orgMembers = orgMemberList.data.map((m) => {
      const uid = m.publicUserData?.userId ?? "";
      const clerkName =
        `${m.publicUserData?.firstName ?? ""} ${m.publicUserData?.lastName ?? ""}`.trim() ||
        m.publicUserData?.identifier ||
        "Unknown";
      return {
        userId: uid,
        userName: displayNameMap.get(uid) ?? clerkName,
        userImage: m.publicUserData?.imageUrl ?? "",
        role: m.role,
        hasAccess: memberIds.has(uid),
      };
    });

    return NextResponse.json({ isRestricted: moduleMembers.length > 0, orgMembers });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
