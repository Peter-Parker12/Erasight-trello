import { cache } from "react";
import { auth } from "@clerk/nextjs/server";

import { isAdminRole } from "@/lib/roles";

// Deduplicate auth() calls within a single request — avoids repeated JWT verification
export const getAuth = cache(auth);

// Read orgRole from the session JWT — no Clerk API call, no network round-trip
export const isOrgAdmin = cache(async (orgId: string): Promise<boolean> => {
  const { orgId: sessionOrgId, orgRole } = await getAuth();
  if (!sessionOrgId || sessionOrgId !== orgId) return false;
  return isAdminRole(orgRole);
});
