import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { ApiDocsClient } from "./_components/api-docs-client";

type ApiDocsPageProps = {
  params: Promise<{ organizationId: string }>;
};

const ApiDocsPage = async ({ params }: ApiDocsPageProps) => {
  const { organizationId } = await params;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  if (!(await isOrgAdmin(orgId))) {
    redirect(`/organization/${organizationId}/settings/app/members`);
  }

  // Fetch API keys to display in authorization examples
  const apiKeys = await db.apiKey.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  // Fetch custom field definitions to dynamically build the API docs payload examples
  const customFields = await db.customFieldDefinition.findMany({
    where: { orgId },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6 py-4">
      <div className="rounded-md border p-4 space-y-1">
        <p className="text-sm text-[#e5e5e5]">
          Explore the Erasight CRM API schema. Below, you will find interactive documentation and 
          code examples that update dynamically based on your custom fields configuration.
        </p>
      </div>

      <ApiDocsClient 
        apiKeys={apiKeys} 
        customFields={customFields} 
        orgId={orgId}
      />
    </div>
  );
};

export default ApiDocsPage;
