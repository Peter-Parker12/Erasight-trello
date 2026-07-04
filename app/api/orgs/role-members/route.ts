import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";

export async function GET(req: Request) {
  try {
    const { orgId } = await auth();
    if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

    if (!(await isOrgAdmin(orgId))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const roleId = new URL(req.url).searchParams.get("roleId");
    if (!roleId) return new NextResponse("Missing roleId", { status: 400 });

    const role = await db.role.findFirst({ where: { id: roleId, orgId } });
    if (!role) return new NextResponse("Not found", { status: 404 });

    const client = await clerkClient();
    const [assignments, orgMemberList, displayNames] = await Promise.all([
      db.userRoleAssignment.findMany({ where: { orgId, roleId } }),
      client.organizations.getOrganizationMembershipList({ organizationId: orgId, limit: 100 }),
      db.userDisplayName.findMany({ where: { orgId } }),
    ]);

    const assignedIds = new Set(assignments.map((a) => a.userId));
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
        orgRole: m.role,
        hasRole: assignedIds.has(uid),
      };
    });

    return NextResponse.json({
      role: { id: role.id, name: role.name, actions: role.actions },
      orgMembers,
    });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
