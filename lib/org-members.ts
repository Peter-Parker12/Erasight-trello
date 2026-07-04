import { clerkClient } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export type OrgMember = {
  userId: string;
  userName: string;
  userImage: string;
  role: string;
};

// Org member list merged with per-org display names — used by OKR pages for
// leader/owner pickers and name lookups.
export const getOrgMembers = async (orgId: string): Promise<OrgMember[]> => {
  const client = await clerkClient();
  const [memberList, displayNames] = await Promise.all([
    client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    }),
    db.userDisplayName.findMany({ where: { orgId } }),
  ]);

  const displayNameMap = new Map(displayNames.map((d) => [d.userId, d.displayName]));

  return memberList.data.map((m) => {
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
    };
  });
};
