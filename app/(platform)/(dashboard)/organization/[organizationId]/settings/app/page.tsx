import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { isOrgAdmin } from "@/lib/board-access";

type AppSettingsIndexPageProps = {
  params: Promise<{ organizationId: string }>;
};

const AppSettingsIndexPage = async ({ params }: AppSettingsIndexPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  const isAdmin = orgId ? await isOrgAdmin(orgId) : false;
  const defaultTab = isAdmin ? "modules" : "members";

  redirect(`/organization/${organizationId}/settings/app/${defaultTab}`);
};

export default AppSettingsIndexPage;
