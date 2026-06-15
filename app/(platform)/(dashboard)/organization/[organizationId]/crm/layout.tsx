import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { canAccessModule } from "@/lib/module-access";

type CrmLayoutProps = PropsWithChildren<{
  params: Promise<{ organizationId: string }>;
}>;

const CrmLayout = async ({ children, params }: CrmLayoutProps) => {
  const { organizationId } = await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");
  if (orgId !== organizationId) redirect("/select-org");

  if (!(await canAccessModule(orgId, userId, "CRM"))) {
    redirect(`/organization/${organizationId}`);
  }

  return <>{children}</>;
};

export default CrmLayout;
