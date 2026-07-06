import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getOrgMembers } from "@/lib/org-members";
import { ResponsibilityView } from "../_components/responsibility-view";

interface Props {
  params: Promise<{ organizationId: string }>;
}

const ResponsibilityPage = async ({ params }: Props) => {
  await params;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");

  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();

  const [departments, members, objectiveCounts, kpiCounts] = await Promise.all([
    db.department.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
    getOrgMembers(orgId),
    db.objective.groupBy({
      by: ["departmentId"],
      where: { orgId, quarter, year },
      _count: { id: true },
    }),
    db.kpi.groupBy({
      by: ["departmentId"],
      where: { orgId },
      _count: { id: true },
    }),
  ]);

  const objectiveCountMap = new Map(
    objectiveCounts.map((c) => [c.departmentId, c._count.id])
  );
  const kpiCountMap = new Map(kpiCounts.map((c) => [c.departmentId, c._count.id]));

  return (
    <ResponsibilityView
      departments={departments}
      members={members}
      objectiveCountMap={Object.fromEntries(
        [...objectiveCountMap].map(([k, v]) => [k ?? "company", v])
      )}
      kpiCountMap={Object.fromEntries(
        [...kpiCountMap].map(([k, v]) => [k ?? "company", v])
      )}
      quarter={quarter}
      year={year}
    />
  );
};

export default ResponsibilityPage;
