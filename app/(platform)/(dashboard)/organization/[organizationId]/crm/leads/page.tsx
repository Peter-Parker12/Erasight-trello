import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { ensureDefaultPipelineStages } from "@/lib/pipeline-stages";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { LeadsBoard } from "./_components/leads-board";

type LeadsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const LeadsPage = async ({ params }: LeadsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

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

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Leads</h1>
        <p className="text-sm text-neutral-500">
          Track deals through your sales pipeline. Drag cards between stages to update progress.
        </p>
      </div>

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
