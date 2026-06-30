import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { isAdminRole } from "@/lib/roles";

// Deduplicate auth() calls within a single request — avoids repeated JWT verification
export const getAuth = cache(auth);

// Check org admin status.
// Fast path: read orgRole from the session JWT (no network).
// Slow path: when the active org isn't in the JWT yet (e.g. fresh incognito session),
// fall back to the Clerk API to check the actual org membership.
export const isOrgAdmin = cache(async (orgId: string): Promise<boolean> => {
  const { orgId: sessionOrgId, orgRole, userId } = await getAuth();

  if (sessionOrgId === orgId) return isAdminRole(orgRole);

  if (!userId) return false;

  try {
    const client = await clerkClient();
    const list = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 500,
    });
    const membership = list.data.find((m) => m.publicUserData?.userId === userId);
    return membership ? isAdminRole(membership.role) : false;
  } catch {
    return false;
  }
});
