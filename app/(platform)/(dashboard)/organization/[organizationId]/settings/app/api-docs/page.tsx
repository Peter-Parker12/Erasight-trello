import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { isOrgAdmin } from "@/lib/board-access";
import { ApiDocsClient } from "./_components/api-docs-client";

type ApiDocsPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ keyId?: string }>;
};

const ApiDocsPage = async ({ params, searchParams }: ApiDocsPageProps) => {
  const { organizationId } = await params;
  const { keyId } = await searchParams;
  const { orgId } = await auth();
  if (!orgId) redirect("/select-org");

  if (!(await isOrgAdmin(orgId))) {
    redirect(`/organization/${organizationId}/settings/app/members`);
  }

  const [allApiKeys, customFields] = await Promise.all([
    db.apiKey.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
    db.customFieldDefinition.findMany({ where: { orgId }, orderBy: { order: "asc" } }),
  ]);

  // If a specific key was requested (via ?keyId=), put it first so the docs pre-fill its prefix.
  const apiKeys = keyId
    ? [
        ...allApiKeys.filter((k) => k.id === keyId),
        ...allApiKeys.filter((k) => k.id !== keyId),
      ]
    : allApiKeys;

  return (
    <div className="space-y-6 py-4">
      <div className="rounded-md border p-4 space-y-1">
        <p className="text-sm text-[#e5e5e5]">
          Explore the Erasight CRM API. Code examples below are pre-filled for the selected API key
          and update dynamically based on your custom fields configuration.
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
