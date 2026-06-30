import type { PropsWithChildren } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { OrgControl } from "./_components/org-control";

export async function generateMetadata() {
  const { orgId } = await auth();

  if (orgId) {
    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      if (org.name) return { title: org.name };
    } catch {
      // fall through to default
    }
  }

  return { title: "Organization" };
}

const OrganizationIdLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <OrgControl />
      {children}
    </>
  );
};

export default OrganizationIdLayout;
