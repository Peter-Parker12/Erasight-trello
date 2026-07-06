import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { canAccessModule } from "@/lib/module-access";

type DashboardLayoutProps = PropsWithChildren<{
  params: Promise<{ organizationId: string }>;
}>;

// Gates the entire Dashboard module (its own pages AND the nested okrs/ pages)
// behind DASHBOARD module access. Since DASHBOARD defaults to "closed", this is
// effectively admins-only (plus anyone explicitly granted in Settings → Modules).
const DashboardLayout = async ({ children, params }: DashboardLayoutProps) => {
  const { organizationId } = await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");
  if (orgId !== organizationId) redirect("/select-org");

  if (!(await canAccessModule(orgId, userId, "DASHBOARD"))) {
    redirect(`/organization/${organizationId}`);
  }

  return <>{children}</>;
};

export default DashboardLayout;
