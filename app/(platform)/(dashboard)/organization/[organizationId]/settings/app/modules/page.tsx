import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { isOrgAdmin } from "@/lib/board-access";
import { MODULE_KEYS, MODULE_REGISTRY } from "@/lib/modules";
import { ModuleAccessPanel } from "./_components/module-access-panel";

type ModulesSettingsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const ModulesSettingsPage = async ({ params }: ModulesSettingsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  if (!(await isOrgAdmin(orgId))) {
    redirect(`/organization/${organizationId}/settings/app/members`);
  }

  return (
    <div className="space-y-4 py-4">
      {MODULE_KEYS.map((key) => (
        <ModuleAccessPanel
          key={key}
          moduleKey={key}
          label={MODULE_REGISTRY[key].label}
          description={MODULE_REGISTRY[key].description}
          defaultAccess={MODULE_REGISTRY[key].defaultAccess}
        />
      ))}
    </div>
  );
};

export default ModulesSettingsPage;
