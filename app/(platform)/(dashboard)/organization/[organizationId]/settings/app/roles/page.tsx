import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { isOrgAdmin } from "@/lib/board-access";
import { listOrgRoles } from "@/lib/rbac";
import { RolesPanel } from "./_components/roles-panel";

type RolesSettingsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const RolesSettingsPage = async ({ params }: RolesSettingsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  if (!(await isOrgAdmin(orgId))) {
    redirect(`/organization/${organizationId}/settings/app/members`);
  }

  const roles = await listOrgRoles(orgId);

  return <RolesPanel initialRoles={roles} />;
};

export default RolesSettingsPage;
