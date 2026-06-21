import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { isAdminRole } from "@/lib/roles";

// Deduplicate auth() calls within a single request — avoids repeated JWT verification
export const getAuth = cache(auth);

// Deduplicate the Clerk membership API call within a single request
export const isOrgAdmin = cache(async (orgId: string): Promise<boolean> => {
  const { userId } = await getAuth();
  if (!userId) return false;
  try {
    const client = await clerkClient();
    const result = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      userId: [userId],
      limit: 1,
    });
    return isAdminRole(result.data[0]?.role);
  } catch {
    return false;
  }
});
