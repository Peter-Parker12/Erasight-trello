import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getOkrRole } from "@/lib/okr-access";
import { KpiDashboard } from "../_components/kpi-dashboard";

interface Props {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ year?: string; half?: string }>;
}

const KpisPage = async ({ params, searchParams }: Props) => {
  const { organizationId } = await params;
  const { year: yearParam, half: halfParam } = await searchParams;
  const { userId, orgId } = await auth();

  if (!userId || !orgId) redirect("/select-org");

  const now = new Date();
  const year = Number(yearParam) || now.getFullYear();
  const half: "H1" | "H2" =
    halfParam === "H1" || halfParam === "H2"
      ? halfParam
      : now.getMonth() < 6
        ? "H1"
        : "H2";

  const [role, departments, kpis] = await Promise.all([
    getOkrRole(orgId),
    db.department.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
    db.kpi.findMany({
      where: { orgId },
      include: { entries: { where: { year } } },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <KpiDashboard
      organizationId={organizationId}
      year={year}
      half={half}
      departments={departments}
      kpis={kpis}
      role={{ isAdmin: role.isAdmin, ledDepartmentIds: role.ledDepartmentIds }}
    />
  );
};

export default KpisPage;
