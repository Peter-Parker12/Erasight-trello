import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { AiSettingsManager } from "./_components/ai-settings-manager";

type AiSettingsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const AiSettingsPage = async ({ params }: AiSettingsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  if (!(await isOrgAdmin(orgId))) {
    redirect(`/organization/${organizationId}/settings/app/members`);
  }

  const [skills, partners] = await Promise.all([
    db.reviewSkill.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
    db.reviewPartner.findMany({ where: { orgId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4 py-4">
      <div className="rounded-md border p-4 space-y-1">
        <p className="text-sm text-[#e5e5e5]">
          Manage review skills and partner knowledge bases used by the AI when reviewing file
          attachments. Skills define <em>how</em> files are reviewed; partners add client-specific
          context. Both are applied automatically — Claude picks the best-matching skill for each
          file.
        </p>
      </div>

      <AiSettingsManager
        orgId={orgId}
        initialSkills={skills}
        initialPartners={partners}
      />
    </div>
  );
};

export default AiSettingsPage;
