import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getOkrRole } from "@/lib/okr-access";
import { getOrgMembers } from "@/lib/org-members";
import { OkrView } from "./_components/okr-view";

interface Props {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ quarter?: string; year?: string }>;
}

const OkrsPage = async ({ params, searchParams }: Props) => {
  const { organizationId } = await params;
  const { quarter: quarterParam, year: yearParam } = await searchParams;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");

  const now = new Date();
  const quarter = Number(quarterParam) || Math.floor(now.getMonth() / 3) + 1;
  const year = Number(yearParam) || now.getFullYear();

  const [role, departments, objectives, members] = await Promise.all([
    getOkrRole(orgId),
    db.department.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
    db.objective.findMany({
      where: { orgId, quarter, year },
      include: {
        keyResults: { orderBy: { order: "asc" } },
        checkIns: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { order: "asc" },
    }),
    getOrgMembers(orgId),
  ]);

  return (
    <OkrView
      organizationId={organizationId}
      quarter={quarter}
      year={year}
      departments={departments}
      objectives={objectives}
      members={members}
      role={{ isAdmin: role.isAdmin, ledDepartmentIds: role.ledDepartmentIds }}
    />
  );
};

export default OkrsPage;
