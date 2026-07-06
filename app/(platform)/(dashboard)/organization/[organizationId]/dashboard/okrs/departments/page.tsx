import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { getOrgMembers } from "@/lib/org-members";
import { DepartmentsView } from "../_components/departments-view";

interface Props {
  params: Promise<{ organizationId: string }>;
}

const DepartmentsPage = async ({ params }: Props) => {
  const { organizationId } = await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");

  const admin = await isOrgAdmin(orgId);
  if (!admin) redirect(`/organization/${organizationId}/dashboard/okrs`);

  const [departments, members, telegramConfig] = await Promise.all([
    db.department.findMany({
      where: { orgId },
      include: { _count: { select: { objectives: true, kpis: true, children: true } } },
      orderBy: { order: "asc" },
    }),
    getOrgMembers(orgId),
    db.orgTelegramConfig.findUnique({ where: { orgId } }),
  ]);

  return (
    <DepartmentsView
      departments={departments}
      members={members}
      telegramConfig={telegramConfig}
    />
  );
};

export default DepartmentsPage;
