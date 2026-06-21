import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { isOrgAdmin } from "@/lib/board-access";
import { SettingsTabs } from "./_components/settings-tabs";

type AppSettingsLayoutProps = PropsWithChildren<{
  params: Promise<{ organizationId: string }>;
}>;

const AppSettingsLayout = async ({ children, params }: AppSettingsLayoutProps) => {
  const { organizationId } = await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");
  if (orgId !== organizationId) redirect("/select-org");

  const isAdmin = await isOrgAdmin(orgId);

  return (
    <div className="w-full p-4 md:p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Configure module access, CRM custom fields, API keys and organization members."
            : "Manage your organization membership."}
        </p>
      </div>

      <SettingsTabs organizationId={organizationId} isAdmin={isAdmin} />

      {children}
    </div>
  );
};

export default AppSettingsLayout;
