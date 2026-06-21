import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Plus, Building2, Globe, Phone } from "lucide-react";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { Button } from "@/components/ui/button";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { KpiCard } from "@/components/crm/kpi-card";
import { CustomFieldsManager } from "@/app/(platform)/(dashboard)/organization/[organizationId]/settings/app/custom-fields/_components/custom-fields-manager";
import { CompaniesTable } from "./_components/companies-table";
import { CompanyFormDialog } from "./_components/company-form-dialog";

type CompaniesPageProps = {
  params: Promise<{ organizationId: string }>;
};

const CompaniesPage = async ({ params }: CompaniesPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const [isAdmin, companies, definitionRows] = await Promise.all([
    isOrgAdmin(orgId),
    db.company.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
    getFieldDefinitions(orgId, "COMPANY"),
  ]);

  const definitions = definitionRows.map(toFieldDefinitionDTO);
  const withDomain = companies.filter((c) => c.domain).length;
  const withPhone = companies.filter((c) => c.phone).length;

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Manage the organizations you do business with.
          </p>
        </div>
        <CompanyFormDialog
          definitions={definitions}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New company
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Total companies" value={companies.length} icon={Building2} />
        <KpiCard label="With domain" value={withDomain} icon={Globe} iconColor="text-emerald-400" />
        <KpiCard label="With phone" value={withPhone} icon={Phone} iconColor="text-amber-400" />
      </div>

      {isAdmin && (
        <CustomFieldsManager entityType="COMPANY" label="Custom fields" fields={definitions} />
      )}

      <CompaniesTable
        companies={companies}
        definitions={definitions}
        organizationId={organizationId}
      />
    </div>
  );
};

export default CompaniesPage;
