import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { ensureDefaultPipelineStages } from "@/lib/pipeline-stages";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { LeadsBoardWrapper } from "./_components/leads-board-wrapper";

type LeadsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const LeadsPage = async ({ params }: LeadsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  await ensureDefaultPipelineStages(orgId);

  const [isAdmin, stages, companies, contacts, products, definitionRows] = await Promise.all([
    isOrgAdmin(orgId),
    db.pipelineStage.findMany({
      where: { orgId },
      orderBy: { order: "asc" },
      include: {
        leads: {
          orderBy: { order: "asc" },
          include: {
            company: { select: { id: true, name: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
            products: { include: { product: { select: { id: true, name: true } } } },
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
    db.product.findMany({
      where: { orgId, status: "ACTIVE" },
      select: { id: true, name: true, unitPrice: true, unit: true },
      orderBy: { name: "asc" },
    }),
    getFieldDefinitions(orgId, "LEAD"),
  ]);

  const definitions = definitionRows.map(toFieldDefinitionDTO);

  return (
    <div className="w-full h-full p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Track deals through your sales pipeline. Drag cards between stages to update progress.
        </p>
      </div>

      {isAdmin && (
        <CustomFieldsManager entityType="LEAD" label="Custom fields" fields={definitions} />
      )}

      <LeadsBoardWrapper
        initialStages={stages}
        companies={companies}
        contacts={contacts}
        products={products}
        definitions={definitions}
        organizationId={organizationId}
      />
    </div>
  );
};

export default LeadsPage;
