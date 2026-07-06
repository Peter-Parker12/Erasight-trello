import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { isOrgAdmin } from "@/lib/board-access";
import { getOrgMembers } from "@/lib/org-members";
import { Info } from "../_components/info";
import { OkrTabs } from "./_components/okr-tabs";
import { ImportWorkbookDialog } from "./_components/import-workbook-dialog";

interface Props {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}

const OkrsLayout = async ({ children, params }: Props) => {
  const { organizationId } = await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");
  if (orgId !== organizationId) redirect(`/organization/${orgId}/okrs`);

  const admin = await isOrgAdmin(orgId);
  const members = admin ? await getOrgMembers(orgId) : [];

  return (
    <div className="w-full mb-20">
      <Info />
      <Separator className="my-4" />
      <div className="px-2 md:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <OkrTabs organizationId={organizationId} isAdmin={admin} />
          </div>
          {admin && (
            <ImportWorkbookDialog organizationId={organizationId} members={members} />
          )}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default OkrsLayout;
