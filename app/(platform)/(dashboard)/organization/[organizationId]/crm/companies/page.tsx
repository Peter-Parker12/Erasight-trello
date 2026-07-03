import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { canAccessModule } from "@/lib/module-access";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { CompaniesClientSection } from "./_components/companies-client-section";

type CompaniesPageProps = {
  params: Promise<{ organizationId: string }>;
};

const CompaniesPage = async ({ params }: CompaniesPageProps) => {
  const { organizationId } = await params;
  const { orgId, userId } = await auth();

  if (!orgId || !userId || orgId !== organizationId) redirect("/select-org");

  const [canManageFields, companies, allBundles, definitionRows] = await Promise.all([
    canAccessModule(orgId, userId, "CRM"),
    db.company.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      include: { bundles: { select: { bundleId: true } } },
    }),
    db.productBundle.findMany({
      where: { orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getFieldDefinitions(orgId, "COMPANY"),
  ]);

  const definitions = definitionRows.map(toFieldDefinitionDTO);

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      {canManageFields && (
        <CustomFieldsManager entityType="COMPANY" label="Custom fields" fields={definitions} />
      )}

      <CompaniesClientSection
        initialCompanies={companies}
        definitions={definitions}
        allBundles={allBundles}
        organizationId={organizationId}
      />
    </div>
  );
};

export default CompaniesPage;
