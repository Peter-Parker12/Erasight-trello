import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { TrendingUp, Trophy, XCircle, DollarSign } from "lucide-react";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { ensureDefaultPipelineStages } from "@/lib/pipeline-stages";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { KpiCard } from "@/components/crm/kpi-card";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { LeadsBoard } from "./_components/leads-board";

type LeadsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const LeadsPage = async ({ params }: LeadsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const isAdmin = await isOrgAdmin(orgId);

  await ensureDefaultPipelineStages(orgId);

  const [stages, companies, contacts, definitionRows] = await Promise.all([
    db.pipelineStage.findMany({
      where: { orgId },
      orderBy: { order: "asc" },
      include: {
        leads: {
          orderBy: { order: "asc" },
          include: {
            company: { select: { id: true, name: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    }),
    db.company.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.contact.findMany({
      where: { orgId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    getFieldDefinitions(orgId, "LEAD"),
  ]);

  const definitions = definitionRows.map(toFieldDefinitionDTO);
  const allLeads = stages.flatMap((s) => s.leads);
  const wonLeads = stages.filter((s) => s.isWon).flatMap((s) => s.leads);
  const lostLeads = stages.filter((s) => s.isLost).flatMap((s) => s.leads);
  const totalValue = allLeads.reduce((sum, l) => sum + Number(l.value ?? 0), 0);

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Track deals through your sales pipeline. Drag cards between stages to update progress.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total leads" value={allLeads.length} icon={TrendingUp} />
        <KpiCard label="Won" value={wonLeads.length} icon={Trophy} iconColor="text-emerald-400" />
        <KpiCard label="Lost" value={lostLeads.length} icon={XCircle} iconColor="text-red-400" />
        <KpiCard label="Pipeline value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} iconColor="text-amber-400" />
      </div>

      {isAdmin && (
        <CustomFieldsManager entityType="LEAD" label="Custom fields" fields={definitions} />
      )}

      <LeadsBoard
        stages={stages}
        companies={companies}
        contacts={contacts}
        definitions={definitions}
        organizationId={organizationId}
      />
    </div>
  );
};

export default LeadsPage;
