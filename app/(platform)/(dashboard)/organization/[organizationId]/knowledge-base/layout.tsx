import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { canAccessModule } from "@/lib/module-access";

type KbLayoutProps = PropsWithChildren<{
  params: Promise<{ organizationId: string }>;
}>;

const KbLayout = async ({ children, params }: KbLayoutProps) => {
  const { organizationId } = await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");
  if (orgId !== organizationId) redirect("/select-org");

  if (!(await canAccessModule(orgId, userId, "KNOWLEDGE_BASE"))) {
    redirect(`/organization/${organizationId}`);
  }

  return <>{children}</>;
};

export default KbLayout;
