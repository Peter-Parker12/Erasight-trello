import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";

import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { getFieldDefinitions, toFieldDefinitionDTO } from "@/lib/custom-fields";
import { CompaniesTable } from "./_components/companies-table";
import { CompanyFormDialog } from "./_components/company-form-dialog";

type CompaniesPageProps = {
  params: Promise<{ organizationId: string }>;
};

const CompaniesPage = async ({ params }: CompaniesPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();

  if (!orgId || orgId !== organizationId) redirect("/select-org");

  const [companies, definitionRows] = await Promise.all([
    db.company.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
    getFieldDefinitions(orgId, "COMPANY"),
  ]);

  const definitions = definitionRows.map(toFieldDefinitionDTO);

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Companies</h1>
          <p className="text-sm text-neutral-500">
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

      <CompaniesTable
        companies={companies}
        definitions={definitions}
        organizationId={organizationId}
      />
    </div>
  );
};

export default CompaniesPage;
