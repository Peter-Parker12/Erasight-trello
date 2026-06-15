import { auth, clerkClient } from "@clerk/nextjs/server";
import { OrganizationList } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { isAdminRole } from "@/lib/roles";

export default async function SelectOrgPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({ userId });

  const isAdmin = memberships.data.some((m) => isAdminRole(m.role));

  return (
    <OrganizationList
      hidePersonal
      afterSelectOrganizationUrl="/organization/:id"
      afterCreateOrganizationUrl="/organization/:id"
      appearance={{
        layout: { logoPlacement: "none" },
        elements: isAdmin
          ? {}
          : { organizationListCreateOrganizationBox: { display: "none" } },
      }}
    />
  );
}
